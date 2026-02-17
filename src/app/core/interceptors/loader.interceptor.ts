import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Loader } from '@core/services/loader';
import { finalize } from 'rxjs';

export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  const loaderService = inject(Loader);

  // Skip requests with custom header to suppress loading
  if (req.headers.has('X-Skip-Loader')) {
    return next(req.clone({ headers: req.headers.delete('X-Skip-Loader') }));
  }

  const requestId = loaderService.show();

  return next(req).pipe(finalize(() => loaderService.hide(requestId)));
};
