-- A guest may only edit or cancel an upcoming reservation before check-in.
create or replace function public.update_guest_reservation(
  p_reservation_id bigint,
  p_guest_id bigint,
  p_start_date date,
  p_end_date date,
  p_guests_count integer,
  p_reserved_price numeric
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  reservation public.reservations;
  room_capacity integer;
begin
  if p_start_date <= current_date or p_end_date <= p_start_date or p_guests_count < 1 or p_reserved_price < 0 then
    return jsonb_build_object('ok', false, 'code', 'INVALID_BOOKING');
  end if;

  select r.* into reservation from public.reservations r
  where r.id = p_reservation_id and r.guest_id = p_guest_id
  for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'NOT_FOUND'); end if;
  if reservation.status not in ('confirmed', 'unconfirmed')
     or reservation.start_date <= current_date
     or reservation.checked_in_at is not null
     or reservation.checked_out_at is not null then
    return jsonb_build_object('ok', false, 'code', 'NOT_EDITABLE');
  end if;

  select capacity into room_capacity from public.rooms where id = reservation.room_id;
  if room_capacity is null or p_guests_count > room_capacity then
    return jsonb_build_object('ok', false, 'code', 'INVALID_CAPACITY');
  end if;

  begin
    update public.reservations set
      start_date = p_start_date,
      end_date = p_end_date,
      guests_count = p_guests_count,
      reserved_price = p_reserved_price,
      updated_at = now()
    where id = p_reservation_id
    returning * into reservation;
  exception when exclusion_violation then
    return jsonb_build_object('ok', false, 'code', '23P01');
  end;
  return jsonb_build_object('ok', true, 'reservation_id', reservation.id);
end;
$$;

create or replace function public.cancel_guest_reservation(
  p_reservation_id bigint,
  p_guest_id bigint
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare updated_id bigint;
begin
  update public.reservations set status = 'cancelled', hold_expires_at = null, updated_at = now()
  where id = p_reservation_id and guest_id = p_guest_id
    and status in ('confirmed', 'unconfirmed')
    and start_date > current_date
    and checked_in_at is null
    and checked_out_at is null
  returning id into updated_id;
  if updated_id is null then return jsonb_build_object('ok', false, 'code', 'NOT_CANCELLABLE'); end if;
  return jsonb_build_object('ok', true, 'reservation_id', updated_id);
end;
$$;

revoke all on function public.update_guest_reservation(bigint,bigint,date,date,integer,numeric) from public, anon, authenticated;
revoke all on function public.cancel_guest_reservation(bigint,bigint) from public, anon, authenticated;
grant execute on function public.update_guest_reservation(bigint,bigint,date,date,integer,numeric) to service_role;
grant execute on function public.cancel_guest_reservation(bigint,bigint) to service_role;
