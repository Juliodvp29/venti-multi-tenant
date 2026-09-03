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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Short time limits to prevent an unresponsive domain from hanging the function.
const DNS_TIMEOUT_MS = 4000;
const FETCH_TIMEOUT_MS = 5000;
// Cooldown between verifications of the same tenant to avoid endpoint spam.
const VERIFY_COOLDOWN_MS = 30_000;

const withTimeout = <T>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
  let timer: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer !== undefined) clearTimeout(timer);
  });
};

const isPrivateIPv4 = (ip: string): boolean => {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  const nums = parts.map(Number);
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const [a, b] = nums;
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 127) return true; // 127.0.0.0/8 loopback
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local (metadata cloud)
  if (a === 0) return true; // 0.0.0.0/8
  return false;
};

const isPrivateIPv6 = (ip: string): boolean => {
  const lower = ip.toLowerCase().replace(/^\[(.*)\]$/, '$1').split('%')[0];
  if (lower === '::1' || lower === '::') return true; // loopback / unspecified
  if (lower.startsWith('::ffff:')) return isPrivateIPv4(lower.slice('::ffff:'.length)); // IPv4-mapped
  const firstGroup = lower.split(':')[0];
  const first = firstGroup ? parseInt(firstGroup, 16) : NaN;
  if (Number.isNaN(first)) return false;
  if ((first & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  if ((first & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
  return false;
};

// Detects private IPs to avoid fetching against loopback, private network,
// link-local (cloud metadata) or IPv6 local addresses before HTTPS check.
const isPrivateIp = (ip: string): boolean =>
  typeof ip === 'string' && (ip.includes(':') ? isPrivateIPv6(ip) : isPrivateIPv4(ip));

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
    if (typeof tenantId !== 'string' || !UUID_RE.test(tenantId)) {
      return json({ error: 'Invalid tenant' }, 400);
    }
    if (!domain || !/^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(domain)) {
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

    const settings = (tenant.settings && typeof tenant.settings === 'object') ? tenant.settings : {};

    // Rate limiting: a maximum of 1 verification every 30 seconds per tenant.
    const lastCheckedRaw = (settings as Record<string, unknown>).custom_domain_last_checked_at;
    const lastChecked = typeof lastCheckedRaw === 'string' ? Date.parse(lastCheckedRaw) : NaN;
    if (!Number.isNaN(lastChecked) && Date.now() - lastChecked < VERIFY_COOLDOWN_MS) {
      const retryAfterSeconds = Math.ceil((VERIFY_COOLDOWN_MS - (Date.now() - lastChecked)) / 1000);
      return json(
        {
          error: 'Verificación demasiado frecuente. Inténtalo de nuevo en unos segundos.',
          retry_after_seconds: retryAfterSeconds,
        },
        429,
      );
    }

    const configuredTarget = Deno.env.get('CUSTOM_DOMAIN_TARGET')
      ?.toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .replace(/\.$/, '');
    const records = await withTimeout(
      Deno.resolveDns(domain, 'CNAME').catch(() => [] as string[]),
      DNS_TIMEOUT_MS,
      'DNS CNAME lookup',
    ).catch(() => [] as string[]);
    const dnsConfigured = configuredTarget
      ? records.some(record => record.toLowerCase().replace(/\.$/, '') === configuredTarget)
      : records.length > 0;

    // Anti-SSRF: resolve A/AAAA records first and do not fetch if the domain
    // points to an internal IP (loopback, private, link-local, cloud metadata).
    // Note: a residual DNS rebinding window remains between resolution
    // and the fetch; a short timeout and a HEAD request without following
    // redirects limit this window.
    let resolvesToPrivateIp = false;
    try {
      const [aRecords, aaaaRecords] = await withTimeout(
        Promise.all([
          Deno.resolveDns(domain, 'A').catch(() => [] as string[]),
          Deno.resolveDns(domain, 'AAAA').catch(() => [] as string[]),
        ]),
        DNS_TIMEOUT_MS,
        'DNS A/AAAA lookup',
      );
      resolvesToPrivateIp = [...aRecords, ...aaaaRecords].some(isPrivateIp);
    } catch {
      resolvesToPrivateIp = false;
    }

    let httpsReachable = false;
    if (!resolvesToPrivateIp) {
      const controller = new AbortController();
      const fetchTimer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      try {
        const response = await fetch(`https://${domain}`, {
          method: 'HEAD',
          redirect: 'manual',
          signal: controller.signal,
        });
        httpsReachable = response.status >= 200 && response.status < 500;
      } catch {
        httpsReachable = false;
      } finally {
        clearTimeout(fetchTimer);
      }
    }

    const status = dnsConfigured && httpsReachable ? 'verified' : 'error';
    const reason = status === 'verified'
      ? null
      : resolvesToPrivateIp
        ? 'El dominio resuelve a una dirección IP interna; verificación bloqueada por seguridad.'
        : !dnsConfigured
          ? 'El registro DNS todavía no apunta al destino configurado.'
          : 'El dominio no responde correctamente por HTTPS.';

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
