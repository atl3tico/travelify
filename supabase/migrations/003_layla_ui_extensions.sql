-- Phase 6: Extend schema for Layla-style UI

-- Add cover image + description + transport to trips
alter table public.trips add column if not exists cover_photo_url text;
alter table public.trips add column if not exists description text;
alter table public.trips add column if not exists num_travelers int default 1;
alter table public.trips add column if not exists budget_currency text default 'EUR';

-- Add category + rating + photo + website to places
alter table public.places add column if not exists category text default 'place';
alter table public.places add column if not exists rating numeric(2,1);
alter table public.places add column if not exists website text;
alter table public.places add column if not exists phone text;

-- Add title + summary to days (for day headings like Layla)
alter table public.days add column if not exists title text;
alter table public.days add column if not exists summary text;
