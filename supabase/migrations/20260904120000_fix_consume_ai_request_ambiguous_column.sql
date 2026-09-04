-- Fix: la variable PL/pgSQL "subscription_ends_at" es ambigua frente a la
-- columna public.tenants.subscription_ends_at (error 42702 al llamar
-- consume_ai_request). Se renombra la variable a v_subscription_ends_at.
create or replace function public.consume_ai_request(p_tenant_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  tenant_plan public.subscription_plan;
  tenant_status public.subscription_status;
  v_subscription_ends_at timestamptz;
  daily_limit integer;
  usage_count integer;
  usage_date_value date := timezone('utc', now())::date;
begin
  if not exists (
    select 1
    from public.tenant_members
    where tenant_id = p_tenant_id
      and user_id = auth.uid()
      and is_active = true
  ) then
    return jsonb_build_object('allowed', false, 'reason', 'unauthorized');
  end if;

  select plan, plan_status, tenants.subscription_ends_at
    into tenant_plan, tenant_status, v_subscription_ends_at
  from public.tenants as tenants
  where id = p_tenant_id
    and deleted_at is null;

  if tenant_plan is null then
    return jsonb_build_object('allowed', false, 'reason', 'tenant_not_found');
  end if;

  if tenant_status in ('suspended', 'expired')
     or (tenant_status = 'cancelled'
         and v_subscription_ends_at is not null
         and v_subscription_ends_at < now()) then
    return jsonb_build_object('allowed', false, 'reason', 'subscription_inactive');
  end if;

  daily_limit := case tenant_plan
    when 'free' then 5
    when 'basic' then 20
    when 'professional' then 50
    when 'enterprise' then 100
  end;

  insert into public.ai_daily_usage (tenant_id, usage_date, requests_used)
  values (p_tenant_id, usage_date_value, 1)
  on conflict (tenant_id, usage_date) do update
    set requests_used = public.ai_daily_usage.requests_used + 1,
        updated_at = now()
    where public.ai_daily_usage.requests_used < daily_limit
  returning requests_used into usage_count;

  if usage_count is null then
    select requests_used into usage_count
    from public.ai_daily_usage
    where tenant_id = p_tenant_id and usage_date = usage_date_value;

    return jsonb_build_object(
      'allowed', false,
      'reason', 'daily_limit_reached',
      'used', usage_count,
      'limit', daily_limit,
      'date', usage_date_value
    );
  end if;

  return jsonb_build_object(
    'allowed', true,
    'used', usage_count,
    'limit', daily_limit,
    'date', usage_date_value
  );
end;
$$;
