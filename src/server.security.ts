import type express from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';

export type PublicTenant = {
  id: string;
  subdomain: string;
  custom_domain: string | null;
};

export type ValidatedHost = {
  hostname: string;
  port: string | null;
};

/**
 * Validates and normalizes a Host or X-Forwarded-Host header value.
 * Rejects invalid syntax, control characters, commas, and unparseable values.
 */
export function validateAndNormalizeHost(rawHost: unknown): ValidatedHost | null {
  if (typeof rawHost !== 'string') {
    return null;
  }

  // RFC 7230 / 9110: Host header must not contain any whitespace, newlines, control characters, or commas
  if (/[\s\r\n\t\0,]/.test(rawHost)) {
    return null;
  }

  const normalized = rawHost.toLowerCase();
  if (!normalized || normalized.length > 253) {
    return null;
  }

  // Reject characters that cannot be part of a valid host or IPv6 address
  if (/[^\w.:[\]-]/.test(normalized)) {
    return null;
  }

  try {
    // Parse using URL API by prefixing a dummy protocol
    const parsed = new URL(`http://${normalized}`);

    // If there is any path, search, hash, or credentials, it's an injection attempt
    if (
      parsed.pathname !== '/' ||
      parsed.search ||
      parsed.hash ||
      parsed.username ||
      parsed.password
    ) {
      return null;
    }

    const hostname = parsed.hostname;
    if (!hostname) {
      return null;
    }

    // Validate hostname structure:
    // - "localhost"
    // - Valid IPv4 address
    // - Valid IPv6 address (brackets stripped by URL parser or enclosed)
    // - Valid domain name: labels 1-63 chars separated by dots, total <= 253, TLD >= 2 chars
    const isLocalhost = hostname === 'localhost';
    const isIPv4 =
      /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) &&
      hostname.split('.').every((octet) => {
        const num = Number(octet);
        return num >= 0 && num <= 255;
      });
    const isIPv6 = hostname.includes(':');
    const isDomain = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(hostname);

    if (!isLocalhost && !isIPv4 && !isIPv6 && !isDomain) {
      return null;
    }

    // Validate port if present
    if (parsed.port) {
      const portNum = Number(parsed.port);
      if (!/^\d+$/.test(parsed.port) || portNum < 1 || portNum > 65535) {
        return null;
      }
    }

    return {
      hostname,
      port: parsed.port || null,
    };
  } catch {
    return null;
  }
}

/**
 * Checks whether the Express request is considered to be behind a trusted proxy.
 */
export function isProxyTrusted(req: express.Request): boolean {
  return Boolean(req.app?.get?.('trust proxy'));
}

/**
 * Extracts and validates the request hostname.
 * Only trusts X-Forwarded-Host if proxy trust is enabled on the Express application.
 */
export function requestHost(req: express.Request): string {
  const trusted = isProxyTrusted(req);
  const rawHeader =
    trusted && req.headers['x-forwarded-host'] ? req.headers['x-forwarded-host'] : req.headers.host;

  const rawHost = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
  const validated = validateAndNormalizeHost(rawHost);
  return validated ? validated.hostname : '';
}

/**
 * Constructs a secure public origin (protocol + host[:port]) from the request.
 * Returns null if the host header is missing, malformed, or untrusted.
 */
export function publicOrigin(req: express.Request): string | null {
  const trusted = isProxyTrusted(req);
  const rawHostHeader =
    trusted && req.headers['x-forwarded-host'] ? req.headers['x-forwarded-host'] : req.headers.host;

  const rawHost = Array.isArray(rawHostHeader) ? rawHostHeader[0] : rawHostHeader;
  const validated = validateAndNormalizeHost(rawHost);
  if (!validated) {
    return null;
  }

  let protocol: string;
  if (trusted && req.headers['x-forwarded-proto']) {
    const rawProto = req.headers['x-forwarded-proto'];
    const protoStr = (Array.isArray(rawProto) ? rawProto[0] : rawProto).toLowerCase().trim();
    if (protoStr === 'https' || protoStr === 'http') {
      protocol = protoStr;
    } else {
      protocol = req.secure ? 'https' : 'http';
    }
  } else {
    protocol = req.secure ? 'https' : req.protocol === 'https' ? 'https' : 'http';
  }

  const hostWithPort =
    validated.port && validated.port !== '80' && validated.port !== '443'
      ? `${validated.hostname}:${validated.port}`
      : validated.hostname;

  return `${protocol}://${hostWithPort}`;
}

/**
 * Escapes characters for XML to prevent XML injection.
 */
export function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}

/**
 * Formats and escapes a date string into an XML <lastmod> element if valid.
 */
export function formatLastMod(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/.test(trimmed)) {
    return `<lastmod>${escapeXml(trimmed)}</lastmod>`;
  }
  return '';
}

/**
 * Resolves a public tenant from an Express request using Supabase.
 * Strictly separates platform domains from custom domains, preventing
 * spoofing or arbitrary tenant selection.
 */
export async function resolvePublicTenant(
  req: express.Request,
  supabase: SupabaseClient,
  configuredPlatformDomain?: string,
): Promise<PublicTenant | null> {
  const host = requestHost(req);
  if (!host) {
    return null;
  }

  // 1. Query parameter fallback (?s=subdomain)
  const rawQuery = req.query?.['s'];
  const querySubdomain = typeof rawQuery === 'string' ? rawQuery.trim().toLowerCase() : null;

  if (querySubdomain) {
    // Validate subdomain format (RFC 1123 label)
    if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(querySubdomain)) {
      return null;
    }
    const { data, error } = await supabase
      .from('tenants')
      .select('id, subdomain, custom_domain')
      .eq('subdomain', querySubdomain)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      console.error('[SEO] Error resolving tenant by query subdomain:', error.message);
      return null;
    }
    return data as PublicTenant | null;
  }

  // 2. Local development fallback
  if (host === 'localhost' || host === '127.0.0.1') {
    const { data, error } = await supabase
      .from('tenants')
      .select('id, subdomain, custom_domain')
      .eq('subdomain', 'jd-store')
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      console.error('[SEO] Error resolving local dev default tenant:', error.message);
      return null;
    }
    return data as PublicTenant | null;
  }

  // 3. Platform domain resolution
  const platformDomain = (configuredPlatformDomain ?? process.env['PLATFORM_DOMAIN'] ?? '')
    .trim()
    .toLowerCase();

  if (platformDomain && (host === platformDomain || host.endsWith('.' + platformDomain))) {
    // Platform root / landing page is not a tenant
    if (host === platformDomain || host === `www.${platformDomain}`) {
      return null;
    }

    const prefix = host.slice(0, -(platformDomain.length + 1));
    const subdomain = prefix.startsWith('www.') ? prefix.slice(4) : prefix;

    if (
      !/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(subdomain) ||
      ['www', 'venti', 'admin', 'api', 'app'].includes(subdomain)
    ) {
      return null;
    }

    const { data, error } = await supabase
      .from('tenants')
      .select('id, subdomain, custom_domain')
      .eq('subdomain', subdomain)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      console.error('[SEO] Error resolving tenant by subdomain:', error.message);
      return null;
    }
    return data as PublicTenant | null;
  }

  // 4. Custom domain resolution
  // Check exact custom_domain match
  const { data: customData, error: customError } = await supabase
    .from('tenants')
    .select('id, subdomain, custom_domain')
    .eq('custom_domain', host)
    .is('deleted_at', null)
    .maybeSingle();

  if (customError) {
    console.error('[SEO] Error resolving tenant by custom domain:', customError.message);
    return null;
  }
  if (customData) {
    return customData as PublicTenant;
  }

  // If host starts with 'www.', check apex domain as fallback
  if (host.startsWith('www.')) {
    const apexHost = host.slice(4);
    const { data: apexData, error: apexError } = await supabase
      .from('tenants')
      .select('id, subdomain, custom_domain')
      .eq('custom_domain', apexHost)
      .is('deleted_at', null)
      .maybeSingle();

    if (apexError) {
      console.error('[SEO] Error resolving tenant by apex custom domain:', apexError.message);
      return null;
    }
    if (apexData) {
      return apexData as PublicTenant;
    }
  }

  // 5. Fallback if PLATFORM_DOMAIN is not set:
  // Check candidate subdomain ONLY if host has at least 3 segments and does not match custom domains
  const parts = host.split('.');
  if (!platformDomain && parts.length >= 3 && !['www', 'venti', 'localhost'].includes(parts[0])) {
    const candidateSubdomain = parts[0];
    if (/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(candidateSubdomain)) {
      const { data: subData, error: subError } = await supabase
        .from('tenants')
        .select('id, subdomain, custom_domain')
        .eq('subdomain', candidateSubdomain)
        .is('deleted_at', null)
        .maybeSingle();

      if (subError) {
        console.error('[SEO] Error resolving candidate subdomain fallback:', subError.message);
        return null;
      }
      if (subData) {
        return subData as PublicTenant;
      }
    }
  }

  return null;
}
