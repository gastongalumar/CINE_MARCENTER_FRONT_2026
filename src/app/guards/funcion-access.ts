import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { puedeAccederFuncion } from '../utils/butacas-access';

/**
 * Solo deja pasar a `/butacas/:peliculaId/funcion/:funcionId/**`
 * si la app autorizó ese funcionId (elección desde horarios o login returnUrl).
 */
export const funcionAccessGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const toastr = inject(ToastrService);

  const peliculaId = Number(
    route.paramMap.get('peliculaId') ?? route.parent?.paramMap.get('peliculaId')
  );
  const funcionId = Number(
    route.paramMap.get('funcionId') ?? route.parent?.paramMap.get('funcionId')
  );

  if (puedeAccederFuncion(funcionId)) {
    return true;
  }

  toastr.warning(
    'Para ver asientos, elegí un horario desde la lista de funciones.',
    'Acceso'
  );

  if (Number.isFinite(peliculaId) && peliculaId > 0) {
    return router.createUrlTree(['/butacas', peliculaId]);
  }
  return router.createUrlTree(['/cartelera']);
};
