-- DEMO DATA ONLY. These sample menu items and prices are for admin onboarding.
-- Review and replace them with the hotel's approved menu before taking orders.
-- Safe to re-run: existing products with the same name are left untouched so
-- edits made by an admin are preserved.

with demo_products(name, description, price_ghs, price_usd) as (
  values
    ('Continental breakfast (adult)', 'Mock menu item. Daily continental breakfast selection.', 40.00::numeric, null::numeric),
    ('Continental breakfast (child)', 'Mock menu item. Continental breakfast portion for a child.', 20.00::numeric, null::numeric),
    ('Jollof rice with grilled chicken', 'Mock menu item. Ghanaian jollof rice served with grilled chicken.', 85.00::numeric, null::numeric),
    ('Grilled tilapia', 'Mock menu item. Grilled tilapia served with a choice of sides.', 120.00::numeric, null::numeric),
    ('Winford club sandwich', 'Mock menu item. Toasted sandwich with chicken, egg, and fresh vegetables.', 65.00::numeric, null::numeric),
    ('Seasoned fries', 'Mock menu item. Golden fries with house seasoning.', 35.00::numeric, null::numeric),
    ('Fresh fruit bowl', 'Mock menu item. Seasonal cut fruit.', 30.00::numeric, null::numeric),
    ('Fresh juice', 'Mock menu item. Freshly prepared juice.', 25.00::numeric, null::numeric),
    ('Bottled water', 'Mock menu item. Chilled bottled water.', 10.00::numeric, null::numeric)
)
insert into public.room_service_products(name, description, price_ghs, price_usd, is_available)
select demo.name, demo.description, demo.price_ghs, demo.price_usd, true
from demo_products demo
where not exists (
  select 1
  from public.room_service_products existing
  where lower(trim(existing.name)) = lower(trim(demo.name))
);
