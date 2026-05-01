-- Add travel_mode to days
alter table public.days add column travel_mode text not null default 'walking';
