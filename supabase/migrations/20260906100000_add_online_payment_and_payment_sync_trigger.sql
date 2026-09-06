-- Migration: 20260906100000_add_online_payment_and_payment_sync_trigger.sql
-- Description: Add online_payment enum value and sync trigger between payments and orders

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = 'public.payment_method'::regtype 
    AND enumlabel = 'online_payment'
  ) THEN
    ALTER TYPE public.payment_method ADD VALUE 'online_payment';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.sync_order_on_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') THEN
    UPDATE public.orders
    SET 
      payment_status = 'completed',
      status = CASE 
        WHEN status = 'pending' THEN 'paid'::public.order_status 
        ELSE status 
      END,
      updated_at = NOW()
    WHERE id = NEW.order_id;
  ELSIF NEW.status = 'failed' AND (OLD.status IS NULL OR OLD.status <> 'failed') THEN
    UPDATE public.orders
    SET 
      payment_status = 'failed',
      updated_at = NOW()
    WHERE id = NEW.order_id AND payment_status = 'pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_order_on_payment_status ON public.payments;

CREATE TRIGGER trg_sync_order_on_payment_status
AFTER INSERT OR UPDATE OF status ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.sync_order_on_payment_status();
