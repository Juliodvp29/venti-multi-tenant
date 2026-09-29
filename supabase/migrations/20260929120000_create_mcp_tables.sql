-- Migration: 20260929120000_create_mcp_tables.sql
-- Creates tables and policies for Model Context Protocol (MCP) integrations

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Create mcp_api_keys table
CREATE TABLE IF NOT EXISTS public.mcp_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT ARRAY['read:orders', 'read:products', 'read:customers', 'read:analytics', 'read:inventory'],
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices for fast key lookup and tenant filtering
CREATE INDEX IF NOT EXISTS idx_mcp_api_keys_tenant_id ON public.mcp_api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mcp_api_keys_key_hash ON public.mcp_api_keys(key_hash) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.mcp_api_keys ENABLE ROW LEVEL SECURITY;

-- Policies for mcp_api_keys: Only tenant admins and owners can view, insert, update or delete keys
DROP POLICY IF EXISTS "Tenant admins can view mcp_api_keys" ON public.mcp_api_keys;
DROP POLICY IF EXISTS "Tenant admins can insert mcp_api_keys" ON public.mcp_api_keys;
DROP POLICY IF EXISTS "Tenant admins can update mcp_api_keys" ON public.mcp_api_keys;
DROP POLICY IF EXISTS "Tenant admins can delete mcp_api_keys" ON public.mcp_api_keys;

CREATE POLICY "Tenant admins can view mcp_api_keys"
ON public.mcp_api_keys
FOR SELECT
TO authenticated
USING (public.is_tenant_admin_or_owner(tenant_id));

CREATE POLICY "Tenant admins can insert mcp_api_keys"
ON public.mcp_api_keys
FOR INSERT
TO authenticated
WITH CHECK (public.is_tenant_admin_or_owner(tenant_id));

CREATE POLICY "Tenant admins can update mcp_api_keys"
ON public.mcp_api_keys
FOR UPDATE
TO authenticated
USING (public.is_tenant_admin_or_owner(tenant_id))
WITH CHECK (public.is_tenant_admin_or_owner(tenant_id));

CREATE POLICY "Tenant admins can delete mcp_api_keys"
ON public.mcp_api_keys
FOR DELETE
TO authenticated
USING (public.is_tenant_admin_or_owner(tenant_id));


-- 2. Create mcp_audit_logs table
CREATE TABLE IF NOT EXISTS public.mcp_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES public.mcp_api_keys(id) ON DELETE SET NULL,
  tool_name TEXT NOT NULL,
  params JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'success',
  execution_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying audit logs by tenant in reverse chronological order
CREATE INDEX IF NOT EXISTS idx_mcp_audit_logs_tenant_created ON public.mcp_audit_logs(tenant_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.mcp_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for mcp_audit_logs
DROP POLICY IF EXISTS "Tenant admins can view mcp_audit_logs" ON public.mcp_audit_logs;
CREATE POLICY "Tenant admins can view mcp_audit_logs"
ON public.mcp_audit_logs
FOR SELECT
TO authenticated
USING (public.is_tenant_admin_or_owner(tenant_id));

-- Function to validate MCP key and return tenant info (callable with service role from edge function)
CREATE OR REPLACE FUNCTION public.verify_mcp_api_key(p_key_hash TEXT)
RETURNS TABLE (
  api_key_id UUID,
  tenant_id UUID,
  name TEXT,
  scopes TEXT[],
  tenant_name TEXT,
  tenant_subdomain TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update last_used_at
  UPDATE public.mcp_api_keys
  SET last_used_at = NOW()
  WHERE key_hash = p_key_hash AND is_active = true;

  RETURN QUERY
  SELECT
    k.id AS api_key_id,
    k.tenant_id,
    k.name,
    k.scopes,
    t.name AS tenant_name,
    t.subdomain AS tenant_subdomain
  FROM public.mcp_api_keys k
  JOIN public.tenants t ON t.id = k.tenant_id
  WHERE k.key_hash = p_key_hash AND k.is_active = true;
END;
$$;
