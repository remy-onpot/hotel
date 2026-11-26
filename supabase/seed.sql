-- Starter room catalog for local/demo setup.
-- Room names follow The Winford Boutique Hotel Achimota's public room categories.
-- These prices are interpreted as Ghana cedis (GHS) by the booking app.
-- Confirm the hotel's approved direct-booking rates before accepting live payments.
-- Upload the referenced image files under the bucket configured by
-- NEXT_PUBLIC_SUPABASE_IMGS_URL (the file paths below begin with `rooms/`).

insert into public.rooms (id, name, description, thumbnail, price, capacity, sleeps, features)
values
  (1, 'Standard King Room', 'A comfortable king room for your stay in Achimota.', 'rooms/standard-king-room.jpg', 120.00, 2, 2, array['Air conditioning', 'Private bathroom', '32-inch LED TV with satellite and streaming', 'Free Wi-Fi', 'Laptop-friendly workspace', 'Tempur-Pedic mattress', 'Frette Italian sheets', 'Minibar', 'Slippers', 'Rainfall shower']),
  (2, 'Superior King Room', 'A spacious king room with room to settle in.', 'rooms/superior-king-room.jpg', 155.00, 2, 2, array['Air conditioning', 'Private bathroom', '32-inch LED TV with satellite and streaming', 'Free Wi-Fi', 'Laptop-friendly workspace', 'Tempur-Pedic mattress', 'Frette Italian sheets', 'Minibar', 'Slippers', 'Rainfall shower']),
  (3, 'Queen Room', 'A welcoming room with a queen bed.', 'rooms/queen-room.jpg', 195.00, 2, 2, array['Air conditioning', 'Private bathroom', '32-inch LED TV with satellite and streaming', 'Free Wi-Fi', 'Laptop-friendly workspace', 'Tempur-Pedic mattress', 'Frette Italian sheets', 'Minibar', 'Slippers', 'Rainfall shower']),
  (4, 'Deluxe King Suite', 'A suite with extra space for a more relaxed stay.', 'rooms/deluxe-king-suite.jpg', 260.00, 2, 2, array['Air conditioning', 'Private bathroom', '32-inch LED TV with satellite and streaming', 'Free Wi-Fi', 'Laptop-friendly workspace', 'Tempur-Pedic mattress', 'Frette Italian sheets', 'Minibar', 'Slippers', 'Rainfall shower']),
  (5, 'Deluxe Family Suite', 'A family suite with capacity for up to four guests.', 'rooms/deluxe-family-suite.jpg', 310.00, 4, 4, array['Air conditioning', 'Private bathroom', '32-inch LED TV with satellite and streaming', 'Free Wi-Fi', 'Laptop-friendly workspace', 'Tempur-Pedic mattress', 'Frette Italian sheets', 'Minibar', 'Slippers', 'Rainfall shower', 'King bed', 'Bunk bed', 'Sofa bed', 'Microwave']),
  (6, 'Executive Suite', 'An executive suite with additional room to unwind.', 'rooms/executive-suite.jpg', 390.00, 2, 2, array['Air conditioning', 'Private bathroom', '32-inch LED TV with satellite and streaming', 'Free Wi-Fi', 'Laptop-friendly workspace', 'Tempur-Pedic mattress', 'Frette Italian sheets', 'Minibar', 'Slippers', 'Rainfall shower'])
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  thumbnail = excluded.thumbnail,
  price = excluded.price,
  capacity = excluded.capacity,
  sleeps = excluded.sleeps,
  features = excluded.features,
  updated_at = now();

-- Advance the identity sequence so future room inserts don't collide with IDs 1–6.
select setval(
  pg_get_serial_sequence('public.rooms', 'id'),
  greatest(coalesce((select max(id) from public.rooms), 1), 1),
  exists (select 1 from public.rooms)
);

insert into public.room_images (room_id, img_path)
values
  (1, 'rooms/standard-king-room.jpg'),
  (1, 'rooms/standard-king-room-detail.jpg'),
  (2, 'rooms/superior-king-room.jpg'),
  (2, 'rooms/superior-king-room-detail.jpg'),
  (3, 'rooms/queen-room.jpg'),
  (3, 'rooms/queen-room-detail.jpg'),
  (4, 'rooms/deluxe-king-suite.jpg'),
  (4, 'rooms/deluxe-king-suite-detail.jpg'),
  (5, 'rooms/deluxe-family-suite.jpg'),
  (5, 'rooms/deluxe-family-suite-detail.jpg'),
  (6, 'rooms/executive-suite.jpg'),
  (6, 'rooms/executive-suite-detail.jpg')
on conflict (room_id, img_path) do nothing;
