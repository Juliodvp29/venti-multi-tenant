create extension if not exists pg_net with schema extensions;

create or replace function public.dispatch_webhook_event()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
declare
  dispatch_url text;
  dispatch_secret text;
  event_payload jsonb;
begin
  select decrypted_secret
    into dispatch_url
    from vault.decrypted_secrets
   where name = 'dispatch-webhook-url';

  select decrypted_secret
    into dispatch_secret
    from vault.decrypted_secrets
   where name = 'dispatch-webhook-secret';

  if dispatch_url is null or dispatch_secret is null then
    raise warning 'Webhook dispatch secrets are not configured';
    return new;
  end if;

  event_payload := to_jsonb(new);

  begin
    perform net.http_post(
      url := dispatch_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-Venti-Internal-Secret', dispatch_secret
      ),
      body := jsonb_build_object(
        'tenant_id', new.tenant_id,
        'event_type', tg_argv[0],
        'payload', event_payload
      )
    );
  exception
    when others then
      raise warning 'Webhook dispatch request could not be queued: %', sqlerrm;
  end;

  return new;
end;
$$;

revoke all on function public.dispatch_webhook_event() from public, anon, authenticated;

drop trigger if exists on_order_created_dispatch_webhook on public.orders;
create trigger on_order_created_dispatch_webhook
  after insert on public.orders
  for each row
  execute function public.dispatch_webhook_event('order.created');

drop trigger if exists on_order_status_changed_dispatch_webhook on public.orders;
create trigger on_order_status_changed_dispatch_webhook
  after update of status on public.orders
  for each row
  when (old.status is distinct from new.status)
  execute function public.dispatch_webhook_event('order.status_changed');

drop trigger if exists on_payment_confirmed_dispatch_webhook on public.payments;
create trigger on_payment_confirmed_dispatch_webhook
  after update of status on public.payments
  for each row
  when (old.status is distinct from new.status and new.status = 'completed')
  execute function public.dispatch_webhook_event('payment.confirmed');

drop trigger if exists on_payment_failed_dispatch_webhook on public.payments;
create trigger on_payment_failed_dispatch_webhook
  after update of status on public.payments
  for each row
  when (old.status is distinct from new.status and new.status = 'failed')
  execute function public.dispatch_webhook_event('payment.failed');

drop trigger if exists on_product_stock_low_dispatch_webhook on public.products;
create trigger on_product_stock_low_dispatch_webhook
  after update of stock_quantity on public.products
  for each row
  when (
    new.stock_quantity is not null
    and new.low_stock_threshold is not null
    and new.stock_quantity <= new.low_stock_threshold
    and (
      old.stock_quantity is null
      or old.low_stock_threshold is distinct from new.low_stock_threshold
      or old.stock_quantity > old.low_stock_threshold
    )
  )
  execute function public.dispatch_webhook_event('product.stock_low');
