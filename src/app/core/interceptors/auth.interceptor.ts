import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '@core/services/auth';
import { environment } from '@env/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Only attach token to requests targeting the Supabase API
  const isSupabaseRequest = req.url.startsWith(environment.supabase.url);
  if (!isSupabaseRequest) return next(req);

  const token = authService.getAccessToken();
  if (!token) return next(req);

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
      apikey: environment.supabase.anonKey,
    },
  });

  return next(authReq);
};
