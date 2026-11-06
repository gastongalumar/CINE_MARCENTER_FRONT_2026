export type EstadoValidacionTicket =
  | 'VALIDADO_AHORA'
  | 'YA_VALIDADO'
  | 'VALIDO'
  | 'CANCELADA';

export interface ValidacionTicketResponse {
  estado: EstadoValidacionTicket;
  numeroTicket: string;
  mensaje: string;
  montoTotal: number;
  asientos: string[];
}
