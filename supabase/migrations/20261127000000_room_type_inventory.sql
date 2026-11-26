-- A rooms row represents a room type. Inventory is the number of physical
-- rooms of that type that can be reserved for the same date range.
alter table public.rooms
  add column if not exists inventory_count integer not null default 1
  check (inventory_count between 1 and 500);

alter table public.reservations drop constraint if exists no_overlapping_reservations;

create or replace function public.enforce_room_type_inventory()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  available_inventory integer;
  overlapping_count integer;
begin
  if new.status not in ('pending', 'confirmed') or new.deleted_at is not null
     or (new.status = 'pending' and new.hold_expires_at <= now()) then
    return new;
  end if;

  -- Serializes claims and reservation edits for a room type so concurrent
  -- transactions cannot both take the final available room.
  select r.inventory_count into available_inventory
  from public.rooms r where r.id = new.room_id for update;
  if available_inventory is null then
    raise exception 'Room type does not exist.' using errcode = '23503';
  end if;

  select count(*) into overlapping_count
  from public.reservations r
  where r.room_id = new.room_id
    and r.id is distinct from new.id
    and r.deleted_at is null
    and (r.status = 'confirmed' or (r.status = 'pending' and r.hold_expires_at > now()))
    and r.start_date < new.end_date and r.end_date > new.start_date;

  if overlapping_count >= available_inventory then
    raise exception 'No rooms of this type remain for those dates.' using errcode = '23P01';
  end if;
  return new;
end;
$$;

drop trigger if exists reservations_room_type_inventory on public.reservations;
create trigger reservations_room_type_inventory
before insert or update of room_id, start_date, end_date, status, hold_expires_at, deleted_at
on public.reservations
for each row execute function public.enforce_room_type_inventory();

create or replace function public.prevent_room_inventory_undersell()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare max_booked integer;
begin
  if new.inventory_count >= old.inventory_count then return new; end if;
  with events as (
    select r.start_date as event_date, 1 as change
    from public.reservations r
    where r.room_id = old.id and r.deleted_at is null
      and (r.status = 'confirmed' or (r.status = 'pending' and r.hold_expires_at > now()))
    union all
    select r.end_date as event_date, -1 as change
    from public.reservations r
    where r.room_id = old.id and r.deleted_at is null
      and (r.status = 'confirmed' or (r.status = 'pending' and r.hold_expires_at > now()))
  ), daily as (
    select event_date, sum(change) as change from events group by event_date
  ), occupancy as (
    select sum(change) over (order by event_date rows unbounded preceding) as booked
    from daily
  )
  select coalesce(max(booked), 0) into max_booked from occupancy;
  if max_booked > new.inventory_count then
    raise exception 'Inventory cannot be reduced below existing overlapping reservations.' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists rooms_prevent_inventory_undersell on public.rooms;
create trigger rooms_prevent_inventory_undersell
before update of inventory_count on public.rooms
for each row execute function public.prevent_room_inventory_undersell();
