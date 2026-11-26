create extension if not exists btree_gist;

alter table public.reservations add column if not exists hold_expires_at timestamptz;
alter table public.reservations add column if not exists booking_source text not null default 'online';
alter table public.reservations add column if not exists payment_method text;
grant select (hold_expires_at) on public.reservations to anon, authenticated;
drop policy if exists "active booking holds are publicly readable" on public.reservations;
create policy "active booking holds are publicly readable" on public.reservations
  for select to anon, authenticated using (status = 'pending' and hold_expires_at > now() and deleted_at is null);
alter table public.reservations drop constraint if exists reservations_status_check;
alter table public.reservations add constraint reservations_status_check
  check (status in ('unconfirmed', 'pending', 'confirmed', 'cancelled', 'canceled', 'finished', 'expired', 'conflict_refund_required'));
alter table public.reservations add constraint reservations_booking_source_check
  check (booking_source in ('online', 'walk_in'));
alter table public.reservations add constraint reservations_payment_method_check
  check (payment_method is null or payment_method in ('paystack', 'cash', 'momo_transfer', 'pos_card'));

-- Pending rows are cleared by the atomic claim RPC before insertion. A time-dependent
-- predicate is not legal in a PostgreSQL exclusion constraint (it must be immutable).
alter table public.reservations drop constraint if exists no_overlapping_reservations;
alter table public.reservations add constraint no_overlapping_reservations
  exclude using gist (room_id with =, daterange(start_date, end_date, '[)') with &&)
  where (status in ('pending', 'confirmed') and deleted_at is null);

alter table public.guests alter column email drop not null;
alter table public.guests alter column password drop not null;
alter table public.guests drop constraint if exists guests_email_unique;
drop index if exists public.guests_email_lower_unique;
create unique index if not exists guests_email_lower_unique on public.guests (lower(email)) where email is not null;
create index if not exists guests_phone_normalized_idx
  on public.guests (regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g'))
  where phone is not null and phone <> '';

create or replace function public.find_guest_by_normalized_phone(p_phone text)
returns table(id bigint, fullname text, email text, phone text)
language sql stable security definer set search_path = '' as $$
  select g.id, g.fullname, g.email, g.phone from public.guests g
  where regexp_replace(coalesce(g.phone, ''), '[^0-9]', '', 'g') = regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g')
  limit 1
$$;
revoke all on function public.find_guest_by_normalized_phone(text) from public, anon, authenticated;
grant execute on function public.find_guest_by_normalized_phone(text) to service_role;

create or replace function public.claim_room_reservation(
  p_room_id bigint, p_guest_id bigint, p_guests_count integer,
  p_start_date date, p_end_date date, p_reserved_price numeric,
  p_currency text default 'GHS', p_message text default '',
  p_status text default 'pending', p_booking_source text default 'online',
  p_payment_method text default null, p_payment_reference text default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare created public.reservations;
begin
  if p_status not in ('pending', 'confirmed') or p_booking_source not in ('online', 'walk_in')
     or p_end_date <= p_start_date or p_guests_count < 1 then
    return jsonb_build_object('ok', false, 'code', 'INVALID_BOOKING', 'message', 'Reservation details are invalid.');
  end if;
  if not exists (select 1 from public.rooms where id = p_room_id and capacity >= p_guests_count) then
    return jsonb_build_object('ok', false, 'code', 'INVALID_CAPACITY', 'message', 'Guest count exceeds room capacity.');
  end if;
  update public.reservations set status = 'expired', updated_at = now()
    where status = 'pending' and hold_expires_at <= now();
  begin
    insert into public.reservations
      (room_id, guest_id, guests_count, start_date, end_date, reserved_price, currency,
       message, status, booking_source, payment_method, payment_reference, hold_expires_at)
    values
      (p_room_id, p_guest_id, p_guests_count, p_start_date, p_end_date, p_reserved_price,
       p_currency, coalesce(p_message, ''), p_status, p_booking_source, p_payment_method,
       p_payment_reference, case when p_status = 'pending' then now() + interval '15 minutes' else null end)
    returning * into created;
  exception when exclusion_violation then
    return jsonb_build_object('ok', false, 'code', '23P01', 'message', 'Room is unavailable for these dates.');
  end;
  return jsonb_build_object('ok', true, 'reservation', to_jsonb(created));
end;
$$;
revoke all on function public.claim_room_reservation(bigint,bigint,integer,date,date,numeric,text,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.claim_room_reservation(bigint,bigint,integer,date,date,numeric,text,text,text,text,text,text) to service_role;
