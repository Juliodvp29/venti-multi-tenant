import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TenantService } from '@core/services/tenant';

export const storeGuard: CanActivateFn = async (route, state) => {
    const tenantService = inject(TenantService);
    const router = inject(Router);

    // Get current hostname
    const hostname = window.location.hostname;

    // 1. Local development handling
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        const urlParams = new URLSearchParams(window.location.search);
        const sParam = urlParams.get('s');
        if (sParam) {
            const subdomain = sParam.split('=')[0].split('?')[0];
            const resolved = await tenantService.resolveTenantBySubdomain(subdomain);
            return resolved;
        }

        // Fallback for local testing if no ?s=
        if (tenantService.tenantId()) return true;

        // Default seed store for easy local dev
        await tenantService.resolveTenantBySubdomain('jd-store');
        return true;
    }

    // 2. Production handling
    const parts = hostname.split('.');

    // Check for custom domain first (e.g., store.com)
    // If it's a 2-part domain or more, it could be a custom domain.
    if (parts.length >= 2) {
        const resolvedByDomain = await tenantService.resolveTenantByDomain(hostname);
        if (resolvedByDomain) return true;
    }

    // Check for subdomain (e.g., tenant.platform.com or tenant.vercel.app)
    if (parts.length >= 3) {
        const subdomain = parts[0];
        const resolvedBySubdomain = await tenantService.resolveTenantBySubdomain(subdomain);
        if (resolvedBySubdomain) return true;
    }

    // 3. Fallback / Not found
    if (tenantService.tenantId()) {
        return true;
    }

    router.navigate(['/404']);
    return false;
};
