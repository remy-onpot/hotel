-- Admins set both nightly rates independently. USD remains display-only;
-- reservations and payment amounts continue to use the GHS price.
alter table public.rooms
  add column if not exists price_usd numeric(10, 2)
  check (price_usd is null or price_usd >= 0);

drop table if exists public.hotel_settings;
