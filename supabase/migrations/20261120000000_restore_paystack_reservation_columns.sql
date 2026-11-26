-- The booking hardening migration may be applied to databases that have not yet
-- received 20261114000000_paystack_ghs.sql. Restore its required columns safely.
alter table public.reservations
  add column if not exists currency text,
  add column if not exists payment_provider text,
  add column if not exists payment_reference text;

update public.reservations
set currency = case when stripe_session_id is not null then 'USD' else 'GHS' end
where currency is null;

update public.reservations
set payment_provider = 'stripe', payment_reference = stripe_session_id
where stripe_session_id is not null and payment_reference is null;

alter table public.reservations
  alter column currency set default 'GHS',
  alter column currency set not null;

create unique index if not exists reservations_payment_reference_unique
  on public.reservations(payment_reference);

revoke select (stripe_session_id, payment_reference) on public.reservations from anon;
grant select (id, room_id, start_date, end_date, status) on public.reservations to anon;
