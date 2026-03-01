import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TenantService } from '@core/services/tenant';

export const storeGuard: CanActivateFn = async (route, state) => {
    const tenantService = inject(TenantService);
    const router = inject(Router);

    // Get current hostname
    const hostname = window.location.hostname;

    let subdomain: string | null = null;

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        const urlParams = new URLSearchParams(window.location.search);
        const sParam = urlParams.get('s');
        if (sParam) {
            subdomain = sParam.split('=')[0].split('?')[0];
        } else {
            if (tenantService.tenantId()) {
                return true;
            }
            subdomain = 'jd-store';
        }
    } else {
        const parts = hostname.split('.');
        if (parts.length >= 3) {
            subdomain = parts[0];
        }
    }

    if (!subdomain) {
        return true;
    }

    const resolved = await tenantService.resolveTenantBySubdomain(subdomain);

    if (!resolved) {
        if (tenantService.tenantId()) {
            return true;
        }
        router.navigate(['/404']);
        return false;
    }

    return true;
};
