import { EstadoReserva } from './estado-reserva';
import { ComboSeleccionado } from './candy-combo';

export interface ReservaComboItem {
  comboId: number;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

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
  subtotalEntradas?: number;
  subtotalCandy?: number;
  descuentoMonto?: number;
  codigoDescuentoAplicado?: string | null;
  combos?: ReservaComboItem[];
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
  combos?: ComboSeleccionado[];
  codigoDescuento?: string;
}
