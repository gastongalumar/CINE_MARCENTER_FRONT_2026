import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../services/auth';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { getDisplayMessage, parseErrorResponse, toApiError } from '../utils/api-error';
import { SKIP_ERROR_TOAST } from '../utils/http.context';
import { isPublicAuthEndpoint } from '../utils/auth-endpoints';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toastr = inject(ToastrService);
  const authService = inject(AuthService);
  const skipToast = req.context.get(SKIP_ERROR_TOAST);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let shouldShowToast = !skipToast;
      const parsed = parseErrorResponse(error);
      let errorMsg = getDisplayMessage(parsed);

      if (typeof ErrorEvent !== 'undefined' && error.error instanceof ErrorEvent) {
        errorMsg = `Error: ${error.error.message}`;
      } else if (error.status === 401) {
        if (isPublicAuthEndpoint(req.url)) {
          shouldShowToast = false;
        } else {
          authService.logout();
          router.navigate(['/cartelera']);
          errorMsg = 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.';
          shouldShowToast = false;
        }
      }

      if (shouldShowToast) {
        toastr.error(errorMsg, 'Error');
      }

      return throwError(() => toApiError(error, errorMsg));
    })
  );
};
