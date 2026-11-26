alter table public.rooms
  add column if not exists features text[] not null default '{}'::text[];
