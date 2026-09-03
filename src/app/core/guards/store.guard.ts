import { inject, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { TenantService } from '@core/services/tenant';

export const storeGuard: CanActivateFn = async (route, state) => {
  const tenantService = inject(TenantService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);
  const document = inject(DOCUMENT);

  let hostname = '';
  let sParam: string | null = null;

  if (isBrowser && typeof window !== 'undefined') {
    hostname = window.location.hostname || '';
    const urlParams = new URLSearchParams(window.location.search);
    sParam = urlParams.get('s');
  } else {
    hostname = document.location?.hostname || '';
    sParam = route.queryParamMap?.get('s') || null;
  }

  // Fallback to route query param if not yet extracted
  if (!sParam && route.queryParamMap) {
    sParam = route.queryParamMap.get('s');
  }

  // 1. Check for query parameter fallback (works in local and prod)
  if (sParam) {
    const subdomain = sParam.split('=')[0].split('?')[0];
    const resolved = await tenantService.resolveTenantBySubdomain(subdomain);
    if (resolved) return true;
  }

  // 2. Local development fallback (if no ?s= and no subdomain)
  if (hostname === 'localhost' || hostname === '127.0.0.1' || !hostname) {
    if (tenantService.tenantId()) return true;
    // Default seed store for easy local dev
    await tenantService.resolveTenantBySubdomain('jd-store');
    return true;
  }

  // 3. Production Handling
  const parts = hostname.split('.');

  // Check for custom domain first (e.g., store.com)
  if (parts.length >= 2) {
    const resolvedByDomain = await tenantService.resolveTenantByDomain(hostname);
    if (resolvedByDomain) return true;
  }

  // Check for subdomain (e.g., tenant.platform.com or tenant.vercel.app)
  if (parts.length >= 3) {
    const subdomain = parts[0];
    // Ensure we don't try to resolve the platform domain itself
    if (!['venti-multi-tenant', 'venti'].includes(subdomain)) {
      const resolvedBySubdomain = await tenantService.resolveTenantBySubdomain(subdomain);
      if (resolvedBySubdomain) return true;
    }
  }

  // 4. Final Fallback / Not found
  if (tenantService.tenantId()) {
    return true;
  }

  router.navigate(['/404']);
  return false;
};
