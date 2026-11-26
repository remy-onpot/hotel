alter table public.room_service_products
  add column if not exists image_path text not null default '';
