-- Let an authenticated guest order against their active, assigned stay.
-- The anonymous room QR flow continues to use submit_room_service_order and
-- its separate check-in access code.
create or replace function public.submit_room_service_order_for_guest(
  p_reservation_id bigint,
  p_guest_id bigint,
  p_items jsonb,
  p_guest_note text default ''
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  stay public.reservations;
  created_order public.room_service_orders;
  item record;
  product public.room_service_products;
  total numeric(10,2) := 0;
  line_total numeric(10,2);
  item_count integer;
begin
  select * into stay from public.reservations r
  where r.id = p_reservation_id and r.guest_id = p_guest_id
    and r.room_unit_id is not null
    and r.checked_in_at is not null and r.checked_out_at is null
    and r.status = 'confirmed' and r.deleted_at is null
    and r.start_date <= current_date and r.end_date > current_date
  for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'NO_ACTIVE_ASSIGNED_STAY'); end if;
  if jsonb_typeof(p_items) <> 'array' then
    return jsonb_build_object('ok', false, 'code', 'INVALID_ITEMS');
  end if;
  select count(*) into item_count from jsonb_array_elements(p_items);
  if item_count < 1 or item_count > 20 then
    return jsonb_build_object('ok', false, 'code', 'INVALID_ITEMS');
  end if;

  insert into public.room_service_orders(reservation_id, room_unit_id, guest_id, guest_note, total_ghs)
  values (stay.id, stay.room_unit_id, stay.guest_id, left(coalesce(p_guest_note, ''), 500), 0)
  returning * into created_order;

  for item in select * from jsonb_to_recordset(p_items) as x(product_id bigint, quantity integer)
  loop
    if item.product_id is null or item.quantity is null or item.quantity < 1 or item.quantity > 20 then
      raise exception 'Invalid room service item quantity.' using errcode = '22023';
    end if;
    select * into product from public.room_service_products p
    where p.id = item.product_id and p.is_available for share;
    if not found then
      delete from public.room_service_orders where id = created_order.id;
      return jsonb_build_object('ok', false, 'code', 'PRODUCT_UNAVAILABLE');
    end if;
    line_total := round(product.price_ghs * item.quantity, 2);
    total := total + line_total;
    insert into public.room_service_order_items(
      order_id, product_id, product_name, quantity, unit_price_ghs, line_total_ghs
    ) values (
      created_order.id, product.id, product.name, item.quantity, product.price_ghs, line_total
    );
  end loop;

  update public.room_service_orders set total_ghs = total, updated_at = now()
  where id = created_order.id;
  return jsonb_build_object('ok', true, 'order_id', created_order.id, 'total_ghs', total);
end;
$$;
revoke all on function public.submit_room_service_order_for_guest(bigint,bigint,jsonb,text) from public, anon, authenticated;
grant execute on function public.submit_room_service_order_for_guest(bigint,bigint,jsonb,text) to service_role;
