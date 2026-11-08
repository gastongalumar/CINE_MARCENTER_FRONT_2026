import { Pipe, PipeTransform } from '@angular/core';
import { EstadoReserva, claseEstadoReserva, etiquetaEstadoReserva } from '../models/estado-reserva';

/**
 * Traduce el estado de una reserva a un texto legible.
 * Ej.: "CONFIRMADA" → "Confirmada".
 */
@Pipe({
  name: 'estadoReserva',
  standalone: true,
})
export class EstadoReservaPipe implements PipeTransform {
  transform(estado: EstadoReserva | string | null | undefined): string {
    return etiquetaEstadoReserva(estado ?? undefined);
  }
}

/**
 * Devuelve la clase CSS (Bootstrap) según el estado de la reserva,
 * para pintar el chip con el color correspondiente.
 */
@Pipe({
  name: 'claseEstadoReserva',
  standalone: true,
})
export class ClaseEstadoReservaPipe implements PipeTransform {
  transform(estado: EstadoReserva | string | null | undefined): string {
    return claseEstadoReserva(estado ?? undefined);
  }
}
