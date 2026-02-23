import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TenantService } from '@core/services/tenant';

export const storeGuard: CanActivateFn = async (route, state) => {
    const tenantService = inject(TenantService);
    const router = inject(Router);

    // Get current hostname
    const hostname = window.location.hostname;

    // Logic to extract subdomain
    // Example: jstore.venti.com -> jstore
    // Example: localhost -> null (or use a test one)
    let subdomain: string | null = null;

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        const urlParams = new URLSearchParams(window.location.search);
        const sParam = urlParams.get('s');
        if (sParam) {
            // Clean up common trailing characters for convenience in testing
            subdomain = sParam.split('=')[0].split('?')[0];
        } else {
            subdomain = 'jstore';
        }
    } else {
        const parts = hostname.split('.');
        if (parts.length >= 3) {
            subdomain = parts[0];
        }
    }

    if (!subdomain) {
        // No subdomain found, maybe handle as main site or redirect
        return true;
    }

    const resolved = await tenantService.resolveTenantBySubdomain(subdomain);

    if (!resolved) {
        // Store not found, redirect to a 404 or main page
        router.navigate(['/404']);
        return false;
    }

    return true;
};
