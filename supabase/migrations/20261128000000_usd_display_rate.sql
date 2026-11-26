-- USD amounts are display-only estimates; booking prices and charges stay GHS.
create table if not exists public.hotel_settings (
  id boolean primary key default true check (id),
  usd_display_ghs_rate numeric(12, 4) check (usd_display_ghs_rate is null or usd_display_ghs_rate > 0),
  updated_at timestamptz not null default now()
);

insert into public.hotel_settings (id, usd_display_ghs_rate)
values (true, null)
on conflict (id) do nothing;

alter table public.hotel_settings enable row level security;
revoke all on public.hotel_settings from anon, authenticated;
grant all on public.hotel_settings to service_role;
