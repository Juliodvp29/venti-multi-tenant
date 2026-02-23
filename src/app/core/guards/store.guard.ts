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
        // For local testing, we can check if there's a param or a default fallback
        // Or we can assume that if it's localhost/store, we might want to use a specific test slug
        // For now, let's look for a query param 's' as a fallback for local testing
        const urlParams = new URLSearchParams(window.location.search);
        subdomain = urlParams.get('s') || 'jstore'; // Defaulting to jstore for convenience
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
