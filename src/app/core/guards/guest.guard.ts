import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/services/auth';

export const guestGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isInitialized()) {
    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (authService.isInitialized()) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });
  }

  if (!authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
