import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { environment } from './environments/environment';
import {
  requestHost,
  publicOrigin,
  resolvePublicTenant,
  escapeXml,
  formatLastMod,
} from './server.security';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const supabase = createClient(environment.supabase.url, environment.supabase.anonKey);

// ── Environment & Proxy Hardening ──────────────────────────────────────────
const isVercel = process.env['VERCEL'] === '1' || Boolean(process.env['VERCEL_ENV']);
const trustProxyEnv = process.env['TRUST_PROXY'];

if (trustProxyEnv !== undefined) {
  if (trustProxyEnv === 'true') {
    app.set('trust proxy', true);
  } else if (trustProxyEnv === 'false') {
    app.set('trust proxy', false);
  } else if (!isNaN(Number(trustProxyEnv))) {
    app.set('trust proxy', Number(trustProxyEnv));
  } else {
    app.set('trust proxy', trustProxyEnv);
  }
} else if (isVercel) {
  // On Vercel, requests are routed through 1 layer of edge proxy
  app.set('trust proxy', 1);
} else {
  // Default to false for standalone Node / local development
  app.set('trust proxy', false);
}

// ── Allowed Hosts Setup ────────────────────────────────────────────────────
const platformDomain = (process.env['PLATFORM_DOMAIN'] || '').trim().toLowerCase();
const allowedHostsSet = new Set<string>(['localhost', '127.0.0.1']);

if (platformDomain) {
  allowedHostsSet.add(platformDomain);
  allowedHostsSet.add(`*.${platformDomain}`);
}

// Add Vercel project deployment domains (specific to this deployment, never wildcard *.vercel.app)
if (process.env['VERCEL_URL']) {
  allowedHostsSet.add(process.env['VERCEL_URL'].trim().toLowerCase());
}
if (process.env['VERCEL_PROJECT_PRODUCTION_URL']) {
  allowedHostsSet.add(process.env['VERCEL_PROJECT_PRODUCTION_URL'].trim().toLowerCase());
}
if (process.env['VERCEL_BRANCH_URL']) {
  allowedHostsSet.add(process.env['VERCEL_BRANCH_URL'].trim().toLowerCase());
}

// Add any explicitly defined allowed hosts from environment
const envAllowedHosts = process.env['ALLOWED_HOSTS'] || process.env['NG_ALLOWED_HOSTS'];
if (envAllowedHosts) {
  for (const host of envAllowedHosts.split(',')) {
    const trimmed = host.trim().toLowerCase();
    if (trimmed && trimmed !== '*') {
      allowedHostsSet.add(trimmed);
    }
  }
}

const isProxyTrustedApp = Boolean(app.get('trust proxy'));
const angularApp = new AngularNodeAppEngine({
  allowedHosts: Array.from(allowedHostsSet),
  trustProxyHeaders: isProxyTrustedApp ? ['x-forwarded-host', 'x-forwarded-proto'] : false,
});

function isHostAllowed(hostname: string): boolean {
  if (allowedHostsSet.has(hostname)) return true;
  for (const allowedHost of allowedHostsSet) {
    if (allowedHost.startsWith('*.')) {
      const domain = allowedHost.slice(1);
      if (hostname.endsWith(domain)) {
        return true;
      }
    }
  }
  return false;
}

function registerAllowedHost(hostname: string): void {
  allowedHostsSet.add(hostname);
  const engine = (angularApp as unknown as { angularAppEngine?: { allowedHosts?: Set<string> } })
    ?.angularAppEngine;
  if (engine?.allowedHosts && typeof engine.allowedHosts.add === 'function') {
    engine.allowedHosts.add(hostname);
  }
}

// ── Host Authorization & Custom Domain Verification Middleware ─────────────
app.use(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const host = requestHost(req);
  if (!host) {
    res.status(400).type('text/plain').send('Bad Request: Invalid or missing Host header');
    return;
  }

  if (!isHostAllowed(host)) {
    // Check if it is an active registered custom domain in Supabase
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('id, custom_domain')
        .eq('custom_domain', host)
        .is('deleted_at', null)
        .maybeSingle();

      if (!error && data) {
        registerAllowedHost(host);
        return next();
      }

      if (host.startsWith('www.')) {
        const apex = host.slice(4);
        const { data: apexData, error: apexError } = await supabase
          .from('tenants')
          .select('id, custom_domain')
          .eq('custom_domain', apex)
          .is('deleted_at', null)
          .maybeSingle();

        if (!apexError && apexData) {
          registerAllowedHost(host);
          return next();
        }
      }
    } catch (err) {
      console.error('[Security] Failed to verify custom domain:', err);
    }
  }

  next();
});

// ── SEO & Public Routes ───────────────────────────────────────────────────
app.get('/robots.txt', async (req, res) => {
  const origin = publicOrigin(req);
  if (!origin) {
    res.status(400).type('text/plain').send('Bad Request: Invalid host header');
    return;
  }

  const tenant = await resolvePublicTenant(req, supabase, platformDomain);
  const lines = [
    'User-agent: *',
    tenant ? 'Allow: /' : 'Disallow: /',
    'Disallow: /auth/',
    'Disallow: /dashboard',
    'Disallow: /products',
    'Disallow: /settings',
    'Disallow: /members',
    'Disallow: /orders',
    'Disallow: /customers',
    'Disallow: /store/checkout',
    'Disallow: /store/carrito',
    'Disallow: /store/success',
    'Disallow: /store/account',
    '',
    'User-agent: GPTBot',
    'Disallow: /',
    '',
    'User-agent: CCBot',
    'Disallow: /',
  ];

  if (tenant) {
    lines.push(`Sitemap: ${origin}/sitemap.xml`);
  }

  res.type('text/plain').send(lines.join('\n'));
});

app.get('/sitemap.xml', async (req, res) => {
  const origin = publicOrigin(req);
  if (!origin) {
    res.status(400).type('text/plain').send('Bad Request: Invalid host header');
    return;
  }

  const tenant = await resolvePublicTenant(req, supabase, platformDomain);
  if (!tenant) {
    res
      .status(404)
      .type('application/xml')
      .send('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>');
    return;
  }

  const [productsRes, categoriesRes] = await Promise.all([
    supabase
      .from('products')
      .select('id, slug, updated_at')
      .eq('tenant_id', tenant.id)
      .in('status', ['active', 'out_of_stock'])
      .is('deleted_at', null),
    supabase
      .from('categories')
      .select('slug, updated_at')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true),
  ]);

  if (productsRes.error) {
    console.error('[SEO] Could not load sitemap products:', productsRes.error.message);
    res
      .status(500)
      .type('application/xml')
      .send('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>');
    return;
  }
  if (categoriesRes.error) {
    console.error('[SEO] Could not load sitemap categories:', categoriesRes.error.message);
  }

  const products = productsRes.data || [];
  const categories = categoriesRes.error ? [] : categoriesRes.data || [];

  const escapedOrigin = escapeXml(origin);
  const urls = [
    `<url><loc>${escapedOrigin}/store</loc></url>`,
    `<url><loc>${escapedOrigin}/store/productos</loc></url>`,
    `<url><loc>${escapedOrigin}/store/contacto</loc></url>`,
    `<url><loc>${escapedOrigin}/store/nosotros</loc></url>`,
    ...categories
      .filter((category) => category.slug)
      .map(
        (category) =>
          `<url><loc>${escapedOrigin}/store/categoria/${encodeURIComponent(category.slug)}</loc>${formatLastMod(category.updated_at)}</url>`,
      ),
    ...products
      .filter((product) => product.slug)
      .map(
        (product) =>
          `<url><loc>${escapedOrigin}/store/product/${encodeURIComponent(product.slug)}</loc>${formatLastMod(product.updated_at)}</url>`,
      ),
  ];

  res
    .type('application/xml')
    .send(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`);
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch((err: unknown) => {
      // El navegador canceló la petición (navegación rápida, recarga, HMR):
      // no hay a quién responderle, así que no es un error real.
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (err instanceof Error && err.name === 'AbortError') return;
      next(err);
    });
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error?: Error | null) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or serverless functions.
 */
export const reqHandler = createNodeRequestHandler(app);
