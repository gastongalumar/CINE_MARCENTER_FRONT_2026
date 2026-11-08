import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TipoUsuario } from '../models/auth';
import { AuthService } from '../services/auth';

/**
 * Guard de roles.
 *
 * Crea un guard parametrizado con los roles permitidos:
 *
 * ```ts
 * { path: 'admin', canActivate: [roleGuard('ADMINISTRADOR')] }
 * ```
 *
 * - Sin sesión → redirige a `/login` (con `returnUrl`).
 * - Con sesión pero sin el rol → redirige a `/cartelera`.
 */
export function roleGuard(...roles: TipoUsuario[]): CanActivateFn {
  return (_route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      return router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url },
      });
    }

    if (authService.tieneRol(...roles)) {
      return true;
    }

    return router.createUrlTree(['/cartelera']);
  };
}
