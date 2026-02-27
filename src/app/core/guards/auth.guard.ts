import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/services/auth';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait for auth to initialize
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

  if (authService.isAuthenticated()) {
    return true;
  }

  // If unauthenticated but trying to accept an invite, send to registration instead of login
  if (state.url.startsWith('/accept-invite')) {
    const urlTree = router.parseUrl(state.url);
    const token = urlTree.queryParams['token'];

    if (token) {
      return router.createUrlTree(['/auth/register'], {
        queryParams: { invite_token: token },
      });
    }
  }

  // Default behavior: send to login with returnUrl
  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: state.url },
  });
};
