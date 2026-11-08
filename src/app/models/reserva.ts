import { EstadoReserva } from './estado-reserva';

/** Respuesta de /api/reservas (ReservaResponseDTO). */
export interface Reserva {
  id?: number;
  numeroTicket: string;
  codigoOR?: string;
  clienteId?: number;
  clienteNombre?: string;
  funcionId?: number;
  peliculaNombre?: string;
  salaNombre?: string;
  /** ISO local: "2026-06-15T20:00:00" */
  horarioFuncion?: string;
  montoTotal: number;
  metodoPago: string;
  fechaEmision?: string;
  fechaValidacion?: string;
  estadoReserva?: EstadoReserva;
  /** El backend lo marca cuando Mercado Pago confirma el pago. */
  pagada?: boolean;
  asientosSeleccionados: string[];
}

/** Body de POST /api/reservas (CrearReservaRequestDTO). */
export interface ReservaRequest {
  funcionId: number;
  metodoPago: string;
  asientosSeleccionados: string[];
}
