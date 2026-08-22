// Runtime: Supabase Edge Functions (Deno), checked when deployed with Supabase CLI.
// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const normalizeDomain = (value: string) =>
  value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/\.$/, '');

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) return json({ error: 'Authentication required' }, 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: 'Authentication required' }, 401);

    const { tenant_id: tenantId, domain: rawDomain } = await request.json();
    const domain = typeof rawDomain === 'string' ? normalizeDomain(rawDomain) : '';
    if (!tenantId || !domain || !/^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(domain)) {
      return json({ error: 'Invalid domain' }, 400);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data: tenant, error: tenantError } = await admin
      .from('tenants')
      .select('id, owner_id, custom_domain, settings')
      .eq('id', tenantId)
      .is('deleted_at', null)
      .maybeSingle();

    if (tenantError) throw tenantError;
    if (!tenant || tenant.owner_id !== user.id || normalizeDomain(tenant.custom_domain || '') !== domain) {
      return json({ error: 'Domain does not belong to this tenant' }, 403);
    }

    const configuredTarget = Deno.env.get('CUSTOM_DOMAIN_TARGET')
      ?.toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .replace(/\.$/, '');
    const records = await Deno.resolveDns(domain, 'CNAME').catch(() => [] as string[]);
    const dnsConfigured = configuredTarget
      ? records.some(record => record.toLowerCase().replace(/\.$/, '') === configuredTarget)
      : records.length > 0;

    let httpsReachable = false;
    try {
      const response = await fetch(`https://${domain}`, { method: 'HEAD', redirect: 'manual' });
      httpsReachable = response.status >= 200 && response.status < 500;
    } catch {
      httpsReachable = false;
    }

    const status = dnsConfigured && httpsReachable ? 'verified' : 'error';
    const reason = status === 'verified'
      ? null
      : !dnsConfigured
        ? 'El registro DNS todavía no apunta al destino configurado.'
        : 'El dominio no responde correctamente por HTTPS.';

    const settings = (tenant.settings && typeof tenant.settings === 'object') ? tenant.settings : {};
    const updatedSettings = {
      ...settings,
      custom_domain_status: status,
      custom_domain_last_checked_at: new Date().toISOString(),
      custom_domain_error: reason,
    };

    const { error: updateError } = await admin
      .from('tenants')
      .update({ settings: updatedSettings })
      .eq('id', tenantId);
    if (updateError) throw updateError;

    return json({ status, dns_configured: dnsConfigured, https_reachable: httpsReachable, reason });
  } catch (error) {
    console.error('verify-domain error:', error);
    return json({ error: 'Unable to verify domain' }, 500);
  }
});
