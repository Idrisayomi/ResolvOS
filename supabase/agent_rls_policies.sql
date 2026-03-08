-- Run this in Supabase SQL editor.
-- Assumes agent role is stored in auth metadata as:
-- auth.jwt()->'app_metadata'->>'role' = 'customer_service_agent'
-- or in roles array:
-- auth.jwt()->'app_metadata'->'roles' includes 'customer_service_agent'

alter table public.tickets enable row level security;
alter table public.orders enable row level security;

create or replace function public.is_customer_service_agent()
returns boolean
language sql
stable
as $$
  select
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'customer_service_agent'
    or coalesce(auth.jwt() -> 'app_metadata' -> 'roles', '[]'::jsonb) ? 'customer_service_agent';
$$;

drop policy if exists tickets_select_agent_only on public.tickets;
create policy tickets_select_agent_only
on public.tickets
for select
to authenticated
using (public.is_customer_service_agent());

drop policy if exists tickets_update_agent_only on public.tickets;
create policy tickets_update_agent_only
on public.tickets
for update
to authenticated
using (public.is_customer_service_agent())
with check (public.is_customer_service_agent());

drop policy if exists orders_select_agent_only on public.orders;
create policy orders_select_agent_only
on public.orders
for select
to authenticated
using (public.is_customer_service_agent());

