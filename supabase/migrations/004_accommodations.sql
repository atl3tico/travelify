-- Phase 6b: Multiple accommodations per trip

create table public.accommodations (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references public.trips(id) on delete cascade,
  name       text not null,
  lat        double precision,
  lng        double precision,
  start_date date not null,
  end_date   date not null,
  notes      text default '',
  created_at timestamptz default now(),
  constraint acc_dates_valid check (end_date >= start_date)
);

alter table public.accommodations enable row level security;

create policy "Users can CRUD own accommodations"
  on public.accommodations for all
  using (
    exists (select 1 from public.trips where trips.id = accommodations.trip_id and trips.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.trips where trips.id = accommodations.trip_id and trips.user_id = auth.uid())
  );

create index idx_accommodations_trip on public.accommodations(trip_id);

-- Migrate existing single accommodation data
insert into public.accommodations (trip_id, name, lat, lng, start_date, end_date)
select id, accommodation_name, accommodation_lat, accommodation_lng, start_date, end_date
from public.trips
where accommodation_name is not null and accommodation_name != '';
