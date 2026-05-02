-- Phase 7: Add estimated_cost to places for budget tracking

alter table public.places add column if not exists estimated_cost numeric(10,2) default 0;
