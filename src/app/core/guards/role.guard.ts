import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TenantService } from '@core/services/tenant';
import { TenantRole } from '@core/enums';
import { ToastService } from '@core/services/toast';

export const roleGuard = (allowedRoles: TenantRole | TenantRole[]): CanActivateFn => {
  return async () => {
    const tenantService = inject(TenantService);
    const router = inject(Router);
    const toast = inject(ToastService);

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

    return router.createUrlTree(['/orders']);
  };
};


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
 * Delivery redirect guard — applied to the dashboard route.
 * Silently redirects Delivery users to /orders before dashboard loads.
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
