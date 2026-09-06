-- Migration: 20260906110000_secure_tenant_payment_secrets.sql
-- Isolates sensitive payment secrets (Bold secret_key, Wompi webhook_secret, integrity_secret)
-- from the public tenants.settings JSONB column into a dedicated table protected by RLS.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Create tenant_payment_secrets table
CREATE TABLE IF NOT EXISTS public.tenant_payment_secrets (
  tenant_id UUID PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  bold_secret_key TEXT,
  wompi_webhook_secret TEXT,
  wompi_integrity_secret TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tenant_payment_secrets ENABLE ROW LEVEL SECURITY;

-- 2. Helper function to check if current user is admin or owner of tenant
CREATE OR REPLACE FUNCTION public.is_tenant_admin_or_owner(p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenants t
    WHERE t.id = p_tenant_id AND t.owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.tenant_members tm
    WHERE tm.tenant_id = p_tenant_id
      AND tm.user_id = auth.uid()
      AND tm.role::text IN ('owner', 'admin')
      AND tm.is_active = true
  ) OR EXISTS (
    SELECT 1 FROM public.tenant_members tm
    WHERE tm.user_id = auth.uid()
      AND tm.role::text = 'superadmin'
      AND tm.is_active = true
  );
$$;

-- RLS policies:
DROP POLICY IF EXISTS "Tenant admins can view payment secrets" ON public.tenant_payment_secrets;
DROP POLICY IF EXISTS "Tenant admins can insert payment secrets" ON public.tenant_payment_secrets;
DROP POLICY IF EXISTS "Tenant admins can update payment secrets" ON public.tenant_payment_secrets;
DROP POLICY IF EXISTS "Tenant admins can delete payment secrets" ON public.tenant_payment_secrets;

CREATE POLICY "Tenant admins can view payment secrets"
ON public.tenant_payment_secrets
FOR SELECT
TO authenticated
USING (public.is_tenant_admin_or_owner(tenant_id));

CREATE POLICY "Tenant admins can insert payment secrets"
ON public.tenant_payment_secrets
FOR INSERT
TO authenticated
WITH CHECK (public.is_tenant_admin_or_owner(tenant_id));

CREATE POLICY "Tenant admins can update payment secrets"
ON public.tenant_payment_secrets
FOR UPDATE
TO authenticated
USING (public.is_tenant_admin_or_owner(tenant_id))
WITH CHECK (public.is_tenant_admin_or_owner(tenant_id));

CREATE POLICY "Tenant admins can delete payment secrets"
ON public.tenant_payment_secrets
FOR DELETE
TO authenticated
USING (public.is_tenant_admin_or_owner(tenant_id));

-- 3. Function to securely generate Bold checkout signature
CREATE OR REPLACE FUNCTION public.get_bold_checkout_signature(
  p_tenant_id UUID,
  p_order_id UUID,
  p_amount NUMERIC,
  p_currency TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_secret_key TEXT;
  v_order_exists BOOLEAN;
  v_raw_text TEXT;
  v_signature TEXT;
  v_amount_int BIGINT;
BEGIN
  -- Validate order exists and belongs to tenant
  SELECT EXISTS (
    SELECT 1 FROM public.orders
    WHERE id = p_order_id AND tenant_id = p_tenant_id
  ) INTO v_order_exists;

  IF NOT v_order_exists THEN
    RETURN jsonb_build_object('success', false, 'error', 'Orden no encontrada o no pertenece a la tienda');
  END IF;

  -- Fetch secret key from tenant_payment_secrets
  SELECT bold_secret_key INTO v_secret_key
  FROM public.tenant_payment_secrets
  WHERE tenant_id = p_tenant_id;

  -- Fallback to tenants.settings if needed
  IF v_secret_key IS NULL OR v_secret_key = '' THEN
    SELECT (settings->'payment_methods'->'online_payment'->'config'->'bold'->>'secret_key')
    INTO v_secret_key
    FROM public.tenants
    WHERE id = p_tenant_id;
  END IF;

  IF v_secret_key IS NULL OR v_secret_key = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Llave secreta de Bold no configurada para este comercio');
  END IF;

  v_amount_int := ROUND(p_amount);
  v_raw_text := p_order_id::TEXT || v_amount_int::TEXT || p_currency || v_secret_key;
  v_signature := encode(digest(v_raw_text, 'sha256'), 'hex');

  RETURN jsonb_build_object(
    'success', true,
    'signature', v_signature
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_bold_checkout_signature(UUID, UUID, NUMERIC, TEXT) TO anon, authenticated, service_role;

-- 4. Migrate existing secrets from tenants.settings
INSERT INTO public.tenant_payment_secrets (tenant_id, bold_secret_key, wompi_webhook_secret)
SELECT 
  id as tenant_id,
  NULLIF(COALESCE(
    settings->'payment_methods'->'online_payment'->'config'->'bold'->>'secret_key',
    settings->'payment_methods'->'credit_card'->'config'->'bold'->>'secret_key'
  ), ''),
  NULLIF(COALESCE(
    settings->'payment_methods'->'online_payment'->'config'->'wompi'->>'webhook_secret',
    settings->'payment_methods'->'credit_card'->'config'->'wompi'->>'webhook_secret'
  ), '')
FROM public.tenants
WHERE settings->'payment_methods' IS NOT NULL
ON CONFLICT (tenant_id) DO UPDATE 
SET 
  bold_secret_key = EXCLUDED.bold_secret_key,
  wompi_webhook_secret = EXCLUDED.wompi_webhook_secret,
  updated_at = NOW();

-- 5. Purge secrets from tenants.settings and preserve boolean flags
UPDATE public.tenants
SET settings = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        settings,
        '{payment_methods,online_payment,config,bold}',
        (settings->'payment_methods'->'online_payment'->'config'->'bold') - 'secret_key' || jsonb_build_object('has_secret_key', true)
      ),
      '{payment_methods,credit_card,config,bold}',
      (settings->'payment_methods'->'credit_card'->'config'->'bold') - 'secret_key' || jsonb_build_object('has_secret_key', true)
    ),
    '{payment_methods,online_payment,config,wompi}',
    (settings->'payment_methods'->'online_payment'->'config'->'wompi') - 'webhook_secret' - 'integrity_secret'
  ),
  '{payment_methods,credit_card,config,wompi}',
  (settings->'payment_methods'->'credit_card'->'config'->'wompi') - 'webhook_secret' - 'integrity_secret'
)
WHERE settings->'payment_methods' IS NOT NULL;
