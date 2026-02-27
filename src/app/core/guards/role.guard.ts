import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TenantService } from '@core/services/tenant';
import { ToastService } from '@core/services/toast';
import { TenantRole } from '@enums/index';

/**
 * Usage in routes:
 * canActivate: [roleGuard('owner')]
 * canActivate: [roleGuard(['owner', 'admin'])]
 *
 * IMPORTANT: The guard waits for the tenant to be initialized before checking the role,
 * preventing false redirects when member data is still loading.
 */
export const roleGuard = (allowedRoles: TenantRole | TenantRole[]): CanActivateFn => {
  return async () => {
    const tenantService = inject(TenantService);
    const router = inject(Router);
    const toast = inject(ToastService);

    // Wait for tenant data to be initialized before checking roles.
    // This prevents false redirects when memberInfo is still loading from Supabase.
    if (!tenantService.initialized()) {
      await new Promise<void>((resolve) => {
        const interval = setInterval(() => {
          if (tenantService.initialized()) {
            clearInterval(interval);
            resolve();
          }
        }, 50);
      });
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    const currentRole = tenantService.memberRole();

    if (currentRole && roles.includes(currentRole as TenantRole)) {
      return true;
    }

    toast.error('No tienes permisos para acceder a esta sección');

    // /orders is accessible to ALL roles — safe universal fallback that avoids loops
    return router.createUrlTree(['/orders']);
  };
};

/** ── Shortcut guards ──────────────────────────────────── */

/** Owner only */
export const ownerGuard: CanActivateFn = roleGuard(TenantRole.Owner);

/** Owner + Admin */
export const adminGuard: CanActivateFn = roleGuard([TenantRole.Owner, TenantRole.Admin]);

/** Owner + Admin + Editor */
export const editorGuard: CanActivateFn = roleGuard([
  TenantRole.Owner,
  TenantRole.Admin,
  TenantRole.Editor,
]);

/** Owner + Admin + Editor + Viewer (everyone except Delivery) */
export const viewerGuard: CanActivateFn = roleGuard([
  TenantRole.Owner,
  TenantRole.Admin,
  TenantRole.Editor,
  TenantRole.Viewer,
]);

/**
 * Delivery redirect guard — applied to the whole main-layout group.
 * If the user is a Delivery agent and the target route is not 'orders',
 * they are silently redirected to /orders.
 */
export const deliveryRedirectGuard: CanActivateFn = async () => {
  const tenantService = inject(TenantService);
  const router = inject(Router);

  // Wait for tenant to load before checking role
  if (!tenantService.initialized()) {
    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (tenantService.initialized()) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });
  }

  const currentRole = tenantService.memberRole();

  if (currentRole === TenantRole.Delivery) {
    return router.createUrlTree(['/orders']);
  }

  return true;
};
