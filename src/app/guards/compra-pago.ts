import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../services/auth';
import { CompraFlujoService } from '../services/compra-flujo.service';

/**
 * Solo permite entrar al checkout si hay asientos seleccionados
 * para la función de la URL y el usuario es cliente.
 */
export const compraPagoGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const toastr = inject(ToastrService);
  const auth = inject(AuthService);
  const compra = inject(CompraFlujoService);

  const peliculaId = Number(route.paramMap.get('peliculaId'));
  const funcionId = Number(route.paramMap.get('funcionId'));

  const asientosUrl = ['/butacas', peliculaId, 'funcion', funcionId];

  if (auth.isAdmin()) {
    toastr.warning(
      'Para comprar entradas debés iniciar sesión con una cuenta de cliente.',
      'Acceso restringido'
    );
    return router.createUrlTree(asientosUrl);
  }

  if (!compra.tieneSeleccionPara(funcionId)) {
    toastr.info('Seleccioná al menos un asiento para continuar al pago.', 'Compra');
    return router.createUrlTree(asientosUrl);
  }

  return true;
};
