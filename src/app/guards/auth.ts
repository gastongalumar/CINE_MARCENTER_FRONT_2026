import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

/**
 * Guard de autenticación.
 *
 * Deja pasar solo si hay un token JWT guardado **y** el mismo no expiró.
 * En caso contrario redirige a `/login` conservando la URL de destino en
 * `returnUrl` para poder volver a ella tras iniciar sesión.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};
