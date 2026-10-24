import { describe, it, expect, vi } from 'vitest';
import type express from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  validateAndNormalizeHost,
  isProxyTrusted,
  requestHost,
  publicOrigin,
  escapeXml,
  formatLastMod,
  resolvePublicTenant,
} from './server.security';

describe('Server Security - Host Validation', () => {
  it('should accept valid localhost and loopback IPv4', () => {
    expect(validateAndNormalizeHost('localhost')).toEqual({ hostname: 'localhost', port: null });
    expect(validateAndNormalizeHost('127.0.0.1')).toEqual({ hostname: '127.0.0.1', port: null });
    expect(validateAndNormalizeHost('localhost:4000')).toEqual({
      hostname: 'localhost',
      port: '4000',
    });
    expect(validateAndNormalizeHost('127.0.0.1:8080')).toEqual({
      hostname: '127.0.0.1',
      port: '8080',
    });
  });

  it('should accept valid standard domain names and subdomains', () => {
    expect(validateAndNormalizeHost('venti.app')).toEqual({ hostname: 'venti.app', port: null });
    expect(validateAndNormalizeHost('store.venti.app')).toEqual({
      hostname: 'store.venti.app',
      port: null,
    });
    expect(validateAndNormalizeHost('my-custom-store.com')).toEqual({
      hostname: 'my-custom-store.com',
      port: null,
    });
    expect(validateAndNormalizeHost('tienda.pe:8443')).toEqual({
      hostname: 'tienda.pe',
      port: '8443',
    });
  });

  it('should normalize uppercase characters to lowercase', () => {
    expect(validateAndNormalizeHost('MY-STORE.COM')).toEqual({
      hostname: 'my-store.com',
      port: null,
    });
    expect(validateAndNormalizeHost('LOCALHOST:3000')).toEqual({
      hostname: 'localhost',
      port: '3000',
    });
  });

  it('should reject invalid or malicious hostnames', () => {
    expect(validateAndNormalizeHost(null)).toBeNull();
    expect(validateAndNormalizeHost(undefined)).toBeNull();
    expect(validateAndNormalizeHost('')).toBeNull();
    expect(validateAndNormalizeHost('   ')).toBeNull();

    // Multiple comma-separated hosts (RFC 7230 violation / header poisoning)
    expect(validateAndNormalizeHost('evil.com, good.com')).toBeNull();

    // Control characters and newlines (HTTP header injection)
    expect(validateAndNormalizeHost('evil.com\r\nX-Injected: true')).toBeNull();
    expect(validateAndNormalizeHost('evil.com\n')).toBeNull();
    expect(validateAndNormalizeHost('evil.com\0')).toBeNull();

    // Path / search / credentials injection
    expect(validateAndNormalizeHost('evil.com/path')).toBeNull();
    expect(validateAndNormalizeHost('evil.com?param=1')).toBeNull();
    expect(validateAndNormalizeHost('evil.com#hash')).toBeNull();
    expect(validateAndNormalizeHost('user:pass@evil.com')).toBeNull();

    // HTML / Script injection
    expect(validateAndNormalizeHost('<script>evil.com</script>')).toBeNull();
    expect(validateAndNormalizeHost('evil.com<loc>')).toBeNull();

    // Invalid port numbers
    expect(validateAndNormalizeHost('example.com:abc')).toBeNull();
    expect(validateAndNormalizeHost('example.com:99999')).toBeNull();
    expect(validateAndNormalizeHost('example.com:0')).toBeNull();
  });
});

describe('Server Security - Proxy & Origin Hardening', () => {
  const createMockRequest = (
    headers: Record<string, string | undefined>,
    trustProxy = false,
    secure = false,
  ): express.Request => {
    return {
      headers,
      secure,
      protocol: secure ? 'https' : 'http',
      app: {
        get: (key: string) => (key === 'trust proxy' ? trustProxy : undefined),
      },
    } as unknown as express.Request;
  };

  it('should not trust X-Forwarded-Host when proxy is not trusted', () => {
    const req = createMockRequest(
      {
        host: 'localhost:4000',
        'x-forwarded-host': 'evil.com',
      },
      false,
    );

    expect(isProxyTrusted(req)).toBe(false);
    expect(requestHost(req)).toBe('localhost');
  });

  it('should trust X-Forwarded-Host when proxy is trusted', () => {
    const req = createMockRequest(
      {
        host: 'internal-pod:8080',
        'x-forwarded-host': 'store.venti.app',
      },
      true,
    );

    expect(isProxyTrusted(req)).toBe(true);
    expect(requestHost(req)).toBe('store.venti.app');
  });

  it('should build publicOrigin safely without trusting proxy when untrusted', () => {
    const req = createMockRequest(
      {
        host: 'localhost:4000',
        'x-forwarded-host': 'attacker.com',
        'x-forwarded-proto': 'javascript',
      },
      false,
    );

    expect(publicOrigin(req)).toBe('http://localhost:4000');
  });

  it('should build publicOrigin with trusted headers when proxy is trusted', () => {
    const req = createMockRequest(
      {
        host: 'internal-pod:8080',
        'x-forwarded-host': 'store.venti.app',
        'x-forwarded-proto': 'https',
      },
      true,
    );

    expect(publicOrigin(req)).toBe('https://store.venti.app');
  });

  it('should reject invalid protocols in X-Forwarded-Proto', () => {
    const req = createMockRequest(
      {
        host: 'store.venti.app',
        'x-forwarded-host': 'store.venti.app',
        'x-forwarded-proto': 'javascript:',
      },
      true,
    );

    // Invalid proto should fall back to req.secure or http, never javascript:
    expect(publicOrigin(req)).toBe('http://store.venti.app');
  });

  it('should return null from publicOrigin when host header is invalid', () => {
    const req = createMockRequest(
      {
        host: 'evil.com<script>',
      },
      false,
    );

    expect(publicOrigin(req)).toBeNull();
  });
});

describe('Server Security - XML Escaping & Sitemap', () => {
  it('should escape XML entities to prevent injection', () => {
    expect(escapeXml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
    );
    expect(escapeXml("https://example.com/store?a=1&b='2'")).toBe(
      'https://example.com/store?a=1&amp;b=&apos;2&apos;',
    );
  });

  it('should format valid ISO dates into XML lastmod', () => {
    expect(formatLastMod('2026-09-03')).toBe('<lastmod>2026-09-03</lastmod>');
    expect(formatLastMod('2026-09-03T12:00:00Z')).toBe('<lastmod>2026-09-03T12:00:00Z</lastmod>');
  });

  it('should ignore invalid date formats for lastmod', () => {
    expect(formatLastMod(null)).toBe('');
    expect(formatLastMod('')).toBe('');
    expect(formatLastMod('invalid-date')).toBe('');
    expect(formatLastMod('<script>2026-01-01</script>')).toBe('');
  });
});

describe('Server Security - Tenant Resolution', () => {
  const createMockSupabase = (
    tenantsData: Array<{ id: string; subdomain: string; custom_domain: string | null }>,
  ) => {
    return {
      from: vi.fn().mockImplementation((table: string) => {
        if (table !== 'tenants') throw new Error(`Unexpected table: ${table}`);
        const filters: Record<string, unknown> = {};
        const builder = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockImplementation((col: string, val: unknown) => {
            filters[col] = val;
            return builder;
          }),
          is: vi.fn().mockImplementation((col: string, val: unknown) => {
            filters[col] = val;
            return builder;
          }),
          maybeSingle: vi.fn().mockImplementation(async () => {
            const match = tenantsData.find((t) => {
              if (filters['subdomain'] !== undefined && t.subdomain !== filters['subdomain'])
                return false;
              if (
                filters['custom_domain'] !== undefined &&
                t.custom_domain !== filters['custom_domain']
              )
                return false;
              return true;
            });
            return { data: match ?? null, error: null };
          }),
        };
        return builder;
      }),
    } as unknown as SupabaseClient;
  };

  const sampleTenants = [
    { id: '1', subdomain: 'jd-store', custom_domain: null },
    { id: '2', subdomain: 'fashion-shop', custom_domain: 'tienda-fashion.com' },
    { id: '3', subdomain: 'store', custom_domain: null },
  ];

  it('should resolve default seed tenant on localhost', async () => {
    const supabase = createMockSupabase(sampleTenants);
    const req = {
      headers: { host: 'localhost:4000' },
      query: {},
      app: { get: () => false },
    } as unknown as express.Request;

    const tenant = await resolvePublicTenant(req, supabase, 'venti.app');
    expect(tenant).not.toBeNull();
    expect(tenant?.subdomain).toBe('jd-store');
  });

  it('should resolve tenant via query parameter ?s=', async () => {
    const supabase = createMockSupabase(sampleTenants);
    const req = {
      headers: { host: 'localhost:4000' },
      query: { s: 'fashion-shop' },
      app: { get: () => false },
    } as unknown as express.Request;

    const tenant = await resolvePublicTenant(req, supabase, 'venti.app');
    expect(tenant?.subdomain).toBe('fashion-shop');
  });

  it('should reject invalid characters in ?s= parameter', async () => {
    const supabase = createMockSupabase(sampleTenants);
    const req = {
      headers: { host: 'localhost:4000' },
      query: { s: 'fashion<script>' },
      app: { get: () => false },
    } as unknown as express.Request;

    const tenant = await resolvePublicTenant(req, supabase, 'venti.app');
    expect(tenant).toBeNull();
  });

  it('should resolve tenant subdomain on configured platform domain', async () => {
    const supabase = createMockSupabase(sampleTenants);
    const req = {
      headers: { host: 'fashion-shop.venti.app' },
      query: {},
      app: { get: () => false },
    } as unknown as express.Request;

    const tenant = await resolvePublicTenant(req, supabase, 'venti.app');
    expect(tenant?.subdomain).toBe('fashion-shop');
  });

  it('should not resolve root platform domain or www.platform as a tenant', async () => {
    const supabase = createMockSupabase(sampleTenants);
    const req1 = {
      headers: { host: 'venti.app' },
      query: {},
      app: { get: () => false },
    } as unknown as express.Request;
    const req2 = {
      headers: { host: 'www.venti.app' },
      query: {},
      app: { get: () => false },
    } as unknown as express.Request;

    expect(await resolvePublicTenant(req1, supabase, 'venti.app')).toBeNull();
    expect(await resolvePublicTenant(req2, supabase, 'venti.app')).toBeNull();
  });

  it('should resolve custom domain without falsely assuming subdomain when 3 segments exist', async () => {
    const customTenants = [
      { id: '10', subdomain: 'store', custom_domain: null },
      { id: '20', subdomain: 'brand-sub', custom_domain: 'store.custombrand.com' },
    ];
    const supabase = createMockSupabase(customTenants);

    const req = {
      headers: { host: 'store.custombrand.com' },
      query: {},
      app: { get: () => false },
    } as unknown as express.Request;

    // Should resolve tenant 20 (store.custombrand.com), NOT tenant 10 (subdomain 'store')
    const tenant = await resolvePublicTenant(req, supabase, 'venti.app');
    expect(tenant?.id).toBe('20');
    expect(tenant?.custom_domain).toBe('store.custombrand.com');
  });

  it('should resolve apex custom domain when accessed with www', async () => {
    const customTenants = [{ id: '30', subdomain: 'my-shop', custom_domain: 'tienda-fashion.com' }];
    const supabase = createMockSupabase(customTenants);

    const req = {
      headers: { host: 'www.tienda-fashion.com' },
      query: {},
      app: { get: () => false },
    } as unknown as express.Request;

    const tenant = await resolvePublicTenant(req, supabase, 'venti.app');
    expect(tenant?.id).toBe('30');
    expect(tenant?.custom_domain).toBe('tienda-fashion.com');
  });
});
