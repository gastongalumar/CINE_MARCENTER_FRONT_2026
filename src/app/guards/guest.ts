import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

/**
 * Guard guest-only.
 *
 * Deja pasar solo si no hay sesión. Si ya hay usuario autenticado:
 * - staff → `/admin`
 * - cliente → `/cartelera`
 */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return true;
  }

  return auth.isAdmin()
    ? router.createUrlTree(['/admin'])
    : router.createUrlTree(['/cartelera']);
};
