import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TenantService } from '@core/services/tenant';
import { ToastService } from '@core/services/toast';
import { TenantRole } from '@enums/index';

/**
 * Usage in routes:
 * canActivate: [roleGuard('owner')]
 * canActivate: [roleGuard(['owner', 'admin'])]
 */
export const roleGuard = (allowedRoles: TenantRole | TenantRole[]): CanActivateFn => {
  return () => {
    const tenantService = inject(TenantService);
    const router = inject(Router);
    const toast = inject(ToastService);

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    const currentRole = tenantService.memberRole();

    if (currentRole && roles.includes(currentRole as TenantRole)) {
      return true;
    }

    toast.error('No tienes permisos para acceder a esta sección');
    return router.createUrlTree(['/dashboard']);
  };
};

/** Shortcut guards */
export const ownerGuard: CanActivateFn = roleGuard(TenantRole.Owner);

export const adminGuard: CanActivateFn = roleGuard([TenantRole.Owner, TenantRole.Admin]);

export const editorGuard: CanActivateFn = roleGuard([
  TenantRole.Owner,
  TenantRole.Admin,
  TenantRole.Editor,
]);
