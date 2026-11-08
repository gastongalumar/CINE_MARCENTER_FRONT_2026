import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { puedeAccederButacas } from '../utils/butacas-access';

/**
 * Solo deja pasar a `/butacas/:id` si la app autorizó ese id
 * (cartelera, ficha o login con returnUrl válido).
 */
export const butacasAccessGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const toastr = inject(ToastrService);
  const id = Number(route.paramMap.get('id'));

  if (puedeAccederButacas(id)) {
    return true;
  }

  toastr.warning(
    'Para elegir asientos, entrá desde la cartelera o la ficha de la película.',
    'Acceso'
  );
  return router.createUrlTree(['/cartelera']);
};
