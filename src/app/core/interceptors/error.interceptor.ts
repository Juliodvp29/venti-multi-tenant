import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { ToastService } from '@core/services/toast';
import { AuthService } from '@core/services/auth';

const ERROR_MESSAGES: Record<number, string> = {
  400: 'Solicitud inválida. Verifica los datos ingresados.',
  401: 'Tu sesión ha expirado. Por favor inicia sesión de nuevo.',
  403: 'No tienes permisos para realizar esta acción.',
  404: 'El recurso solicitado no fue encontrado.',
  409: 'Conflicto: ya existe un registro con esos datos.',
  422: 'Los datos enviados no son válidos.',
  429: 'Demasiadas solicitudes. Intenta de nuevo en unos momentos.',
  500: 'Error interno del servidor. Intenta de nuevo más tarde.',
  503: 'Servicio no disponible. Intenta de nuevo más tarde.',
};

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toast = inject(ToastService);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Don't show toast if request opted out
      const silent = req.headers.has('X-Silent-Error');

      if (!silent) {
        const message = ERROR_MESSAGES[error.status] ?? `Error ${error.status}: ${error.message}`;

        if (error.status === 401) {
          authService.signOut();
          toast.error(message, 'Sesión expirada');
        } else if (error.status === 403) {
          toast.error(message, 'Sin permisos');
          router.navigate(['/dashboard']);
        } else if (error.status >= 500) {
          toast.error(message, 'Error del servidor');
        } else if (error.status !== 0) {
          // Don't show toast for network errors (status 0)
          toast.error(message);
        }

        if (error.status === 0) {
          toast.error('Sin conexión a internet. Verifica tu red.');
        }
      }

      return throwError(() => error);
    })
  );
};
