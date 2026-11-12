import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth';
import { ReservaService } from '../services/reserva';

/**
 * Solo deja ver `/ticket/:numero` al CLIENTE dueño de esa reserva.
 * Ticket inexistente o de otra cuenta → `/mis-reservas`.
 */
export const ticketOwnerGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const toastr = inject(ToastrService);
  const auth = inject(AuthService);
  const reservaService = inject(ReservaService);

  const numero = (route.paramMap.get('numero') || '').trim();
  const misReservas = router.createUrlTree(['/mis-reservas']);

  if (!numero) {
    toastr.warning('No se indicó un número de ticket.', 'Ticket');
    return misReservas;
  }

  const userId = auth.getUserId();
  if (userId == null) {
    toastr.warning('Tenés que iniciar sesión para ver tu ticket.', 'Ticket');
    return misReservas;
  }

  // skipErrorToast: un solo aviso del guard (evita toast del interceptor + warning).
  return reservaService.obtenerPorTicket(numero, { skipErrorToast: true }).pipe(
    map((reserva) => {
      if (reserva.clienteId != null && reserva.clienteId === userId) {
        return true;
      }
      // Mismo mensaje que 404: no revelar que el ticket existe en otra cuenta.
      toastr.warning('No encontramos ese ticket.', 'Ticket');
      return misReservas;
    }),
    catchError(() => {
      toastr.warning('No encontramos ese ticket.', 'Ticket');
      return of(misReservas);
    })
  );
};
