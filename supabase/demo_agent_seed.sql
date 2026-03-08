-- Demo setup for ResolvOS agent dashboard.
-- Step 1: In Supabase Dashboard -> Authentication -> Users, create the agent user first
-- with email/password. Then run this script.

-- ===== INPUTS (edit these) =====
-- Replace with the email you created in Auth users.
-- Example: 'agent@resolvos.io'
do $$
declare
  v_agent_email text := 'agent@example.com';
  v_agent_name text := 'Demo Support Agent';
  v_user_id uuid;
begin
  -- Find auth user
  select id into v_user_id
  from auth.users
  where email = v_agent_email
  limit 1;

  if v_user_id is null then
    raise exception 'No auth user found for email: %', v_agent_email;
  end if;

  -- Grant agent role in app metadata
  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(
    'role', 'customer_service_agent',
    'roles', jsonb_build_array('customer_service_agent')
  )
  where id = v_user_id;

  -- Ensure profile row exists for FK (public.users.full_name is NOT NULL)
  insert into public.users (id, full_name)
  values (v_user_id, v_agent_name)
  on conflict (id) do update
  set full_name = coalesce(public.users.full_name, excluded.full_name);

  -- Optional: demo orders
  insert into public.orders (id, user_id, price, status, is_returnable)
  values
    ('ORD-501', v_user_id, 24.99, 'delivered', true),
    ('ORD-502', v_user_id, 145.00, 'delivered', true),
    ('ORD-503', v_user_id, 59.99, 'delivered', false)
  on conflict (id) do nothing;

  -- Optional: demo tickets
  insert into public.tickets (id, order_id, user_id, status, ai_summary, assigned_to)
  values
    (
      'T-2001',
      'ORD-501',
      v_user_id,
      'Resolved',
      'Auto-approved refund for $24.99. Reason: Wrong color shipped.',
      'AI_Agent'
    ),
    (
      'T-2002',
      'ORD-502',
      v_user_id,
      'Needs Human Review',
      'High-value item ($145.00) requires manual approval. Reason: Damaged on arrival.',
      'Human_Staff'
    ),
    (
      'T-2003',
      'ORD-503',
      v_user_id,
      'Needs Human Review',
      'Item marked non-returnable but user requested exception. Reason: Manufacturing defect claim.',
      'Human_Staff'
    )
  on conflict (id) do nothing;
end $$;

-- Verify role assignment
select
  id,
  email,
  raw_app_meta_data
from auth.users
where email = 'agent@example.com';
