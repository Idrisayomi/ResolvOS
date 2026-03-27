-- Demo customer seed for chat flow scenarios.
-- This script creates data for hardcoded user:
-- 11111111-1111-1111-1111-111111111111
--
-- Outcomes covered:
-- 1) Auto-approved: cheap + returnable
-- 2) Escalated: expensive + returnable
-- 3) Rejected: non-returnable

do $$
declare
  v_demo_user_id uuid := '11111111-1111-1111-1111-111111111111';
begin
  -- Ensure item_name exists for realistic policy inference in chat.
  alter table public.orders
    add column if not exists item_name text;

  -- Ensure a profile row exists for FK integrity.
  insert into public.users (id, full_name)
  values (v_demo_user_id, 'Demo Customer')
  on conflict (id) do update
    set full_name = coalesce(public.users.full_name, excluded.full_name);

  -- Seed three scenario orders.
  insert into public.orders (id, user_id, item_name, price, status, is_returnable)
  values
    ('ORD-101', v_demo_user_id, 'Clear Phone Case', 24.99, 'delivered', true),
    ('ORD-102', v_demo_user_id, 'Wireless Headphones', 189.00, 'delivered', true),
    ('ORD-103', v_demo_user_id, 'Luxury Perfume', 79.00, 'delivered', false)
  on conflict (id) do update
    set
      user_id = excluded.user_id,
      item_name = excluded.item_name,
      price = excluded.price,
      status = excluded.status,
      is_returnable = excluded.is_returnable;
end $$;

-- Quick verification
select id, user_id, item_name, price, status, is_returnable
from public.orders
where user_id = '11111111-1111-1111-1111-111111111111'
order by id;

