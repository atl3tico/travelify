alter table public.places
  add column if not exists flight_number text,
  add column if not exists airline text,
  add column if not exists origin text,
  add column if not exists destination text,
  add column if not exists arrival_time text;
