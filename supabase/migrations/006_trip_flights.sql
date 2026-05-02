alter table public.trips
  add column if not exists outbound_flight_number text,
  add column if not exists outbound_airline text,
  add column if not exists outbound_origin text,
  add column if not exists outbound_destination text,
  add column if not exists outbound_departure_time text,
  add column if not exists outbound_arrival_time text,
  add column if not exists return_flight_number text,
  add column if not exists return_airline text,
  add column if not exists return_origin text,
  add column if not exists return_destination text,
  add column if not exists return_departure_time text,
  add column if not exists return_arrival_time text;
