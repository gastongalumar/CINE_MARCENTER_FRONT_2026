import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

/**
 * Exige `?token=` en `/reset-password`.
 * Sin token → toast + `/olvidar-password`.
 */
export const resetTokenGuard: CanActivateFn = (route) => {
  const token = (route.queryParamMap.get('token') || '').trim();
  if (token) {
    return true;
  }

  inject(ToastrService).warning('El enlace de recuperación no es válido.', 'Contraseña');
  return inject(Router).createUrlTree(['/olvidar-password']);
};
