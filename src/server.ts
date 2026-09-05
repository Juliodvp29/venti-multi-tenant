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

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();
const supabase = createClient(environment.supabase.url, environment.supabase.anonKey);

type PublicTenant = {
  id: string;
  subdomain: string;
  custom_domain: string | null;
};

function requestHost(req: express.Request): string {
  return (req.headers['x-forwarded-host'] || req.headers.host || '')
    .toString()
    .split(',')[0]
    .split(':')[0]
    .toLowerCase();
}

async function resolvePublicTenant(req: express.Request): Promise<PublicTenant | null> {
  const host = requestHost(req);
  const querySubdomain = typeof req.query['s'] === 'string' ? req.query['s'] : null;

  let query = supabase
    .from('tenants')
    .select('id, subdomain, custom_domain')
    .is('deleted_at', null);

  if (querySubdomain) {
    query = query.eq('subdomain', querySubdomain.trim());
  } else if (host === 'localhost' || host === '127.0.0.1') {
    query = query.eq('subdomain', 'jd-store');
  } else {
    const parts = host.split('.');
    const subdomain = parts.length >= 3 && !['www', 'venti'].includes(parts[0]) ? parts[0] : null;
    query = subdomain ? query.eq('subdomain', subdomain) : query.eq('custom_domain', host);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    console.error('[SEO] Could not resolve public tenant:', error);
    return null;
  }
  return data as PublicTenant | null;
}

function publicOrigin(req: express.Request): string {
  const protocol = (req.headers['x-forwarded-proto'] || req.protocol).toString().split(',')[0];
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString().split(',')[0];
  return `${protocol}://${host}`;
}

app.get('/robots.txt', async (req, res) => {
  const tenant = await resolvePublicTenant(req);
  const sitemapUrl = `${publicOrigin(req)}/sitemap.xml`;
  res
    .type('text/plain')
    .send(
      [
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
        `Sitemap: ${sitemapUrl}`,
      ].join('\n'),
    );
});

app.get('/sitemap.xml', async (req, res) => {
  const tenant = await resolvePublicTenant(req);
  if (!tenant) {
    res
      .status(404)
      .type('application/xml')
      .send('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>');
    return;
  }

  const origin = publicOrigin(req);
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
    console.error('[SEO] Could not load sitemap products:', productsRes.error);
    res
      .status(500)
      .type('application/xml')
      .send('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>');
    return;
  }
  if (categoriesRes.error) {
    console.error('[SEO] Could not load sitemap categories:', categoriesRes.error);
  }

  const products = productsRes.data || [];
  const categories = categoriesRes.error ? [] : categoriesRes.data || [];

  const lastmod = (value: string | null) => (value ? `<lastmod>${value}</lastmod>` : '');
  const urls = [
    `<url><loc>${origin}/store</loc></url>`,
    `<url><loc>${origin}/store/productos</loc></url>`,
    `<url><loc>${origin}/store/contacto</loc></url>`,
    `<url><loc>${origin}/store/nosotros</loc></url>`,
    ...categories
      .filter((category) => category.slug)
      .map(
        (category) =>
          `<url><loc>${origin}/store/categoria/${encodeURIComponent(category.slug)}</loc>${lastmod(category.updated_at)}</url>`,
      ),
    ...(products || []).map(
      (product) =>
        `<url><loc>${origin}/store/product/${encodeURIComponent(product.slug)}</loc>${lastmod(product.updated_at)}</url>`,
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
