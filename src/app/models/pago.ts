/** Respuesta de /api/pagos (PagoResponseDTO). */
export interface Pago {
  id?: number;
  numeroTicket: string;
  monto: number;
  metodoPago: string;
  estado: string;
  fechaPago?: string;
}
