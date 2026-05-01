-- Phase 1: Core tables + RLS

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- =============================================
-- TRIPS
-- =============================================
create table public.trips (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  name                 text not null,
  destination          text not null,
  accommodation_name   text,
  accommodation_lat    double precision,
  accommodation_lng    double precision,
  start_date           date not null,
  end_date             date not null,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now(),
  constraint trip_dates_valid check (end_date >= start_date)
);

alter table public.trips enable row level security;

create policy "Users can CRUD own trips"
  on public.trips for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =============================================
-- DAYS
-- =============================================
create table public.days (
  id           uuid primary key default gen_random_uuid(),
  trip_id      uuid not null references public.trips(id) on delete cascade,
  date         date not null,
  day_index    int not null,
  notes        text default '',
  constraint unique_day_per_trip unique (trip_id, date)
);

alter table public.days enable row level security;

create policy "Users can CRUD own days"
  on public.days for all
  using (
    exists (select 1 from public.trips where trips.id = days.trip_id and trips.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.trips where trips.id = days.trip_id and trips.user_id = auth.uid())
  );

-- =============================================
-- PLACES
-- =============================================
create table public.places (
  id               uuid primary key default gen_random_uuid(),
  day_id           uuid not null references public.days(id) on delete cascade,
  name             text not null,
  google_place_id  text,
  lat              double precision not null,
  lng              double precision not null,
  address          text,
  visit_duration   int default 60,
  order_index      int not null default 0,
  notes            text default '',
  photo_url        text,
  created_at       timestamptz default now()
);

alter table public.places enable row level security;

create policy "Users can CRUD own places"
  on public.places for all
  using (
    exists (
      select 1 from public.days d
      join public.trips t on t.id = d.trip_id
      where d.id = places.day_id and t.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.days d
      join public.trips t on t.id = d.trip_id
      where d.id = places.day_id and t.user_id = auth.uid()
    )
  );

-- =============================================
-- INDEXES
-- =============================================
create index idx_trips_user on public.trips(user_id);
create index idx_trips_dates on public.trips(start_date, end_date);
create index idx_days_trip on public.days(trip_id);
create index idx_days_date on public.days(date);
create index idx_places_day on public.places(day_id);
create index idx_places_order on public.places(day_id, order_index);

-- =============================================
-- TRIGGER: auto-generate days on trip insert
-- =============================================
create or replace function public.generate_trip_days()
returns trigger as $$
declare
  current_date_val date;
  idx int := 1;
begin
  current_date_val := new.start_date;
  while current_date_val <= new.end_date loop
    insert into public.days (trip_id, date, day_index)
    values (new.id, current_date_val, idx);
    current_date_val := current_date_val + interval '1 day';
    idx := idx + 1;
  end loop;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_trip_created
  after insert on public.trips
  for each row execute function public.generate_trip_days();

-- =============================================
-- TRIGGER: update updated_at
-- =============================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_trip_update
  before update on public.trips
  for each row execute function public.update_updated_at();
