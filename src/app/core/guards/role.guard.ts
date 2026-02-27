import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TenantService } from '@core/services/tenant';
import { TenantRole } from '@core/enums';
import { ToastService } from '@core/services/toast';

export const roleGuard: CanActivateFn = (route, state) => {
  const tenantService = inject(TenantService);
  const router = inject(Router);
  const toast = inject(ToastService);

  // Read required roles from the route data
  const requiredRoles = route.data?.['roles'] as string[] | undefined;

  // If no roles are required, let them in
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  const currentRole = tenantService.currentRole();

  // If we don't have a role somehow but we need one, block
  if (!currentRole) {
    router.navigate(['/auth/login']);
    return false;
  }

  // Owner and Admin always have access unless strictly excluded
  const isAdminOrOwner = currentRole === TenantRole.Owner || currentRole === TenantRole.Admin;

  if (isAdminOrOwner || requiredRoles.includes(currentRole as string)) {
    return true;
  }

  // User does not have the required role
  console.warn(`Access Denied. User role ${currentRole} missing required roles:`, requiredRoles);
  toast.warning('Acceso Restringido', 'No tienes permisos para ver este módulo.');

  // Send highly restrictive users (like delivery) to their only screen, else dashboard
  if (currentRole === TenantRole.Delivery) {
    return router.createUrlTree(['/orders']);
  }

  return router.createUrlTree(['/dashboard']);
};
