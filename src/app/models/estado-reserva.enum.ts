/** Estados del enum EstadoReserva del backend. */
export enum EstadoReserva {
  PENDIENTE = 'PENDIENTE',
  CONFIRMADA = 'CONFIRMADA',
  VALIDADA = 'VALIDADA',
  CANCELADA = 'CANCELADA',
  EXPIRADA = 'EXPIRADA',
  REEMBOLSADA = 'REEMBOLSADA',
}

const ETIQUETAS: Record<EstadoReserva, string> = {
  [EstadoReserva.PENDIENTE]: 'Pendiente',
  [EstadoReserva.CONFIRMADA]: 'Confirmada',
  [EstadoReserva.VALIDADA]: 'Validada',
  [EstadoReserva.CANCELADA]: 'Cancelada',
  [EstadoReserva.EXPIRADA]: 'Expirada',
  [EstadoReserva.REEMBOLSADA]: 'Reembolsada',
};

/** Clase de Bootstrap para colorear el chip según el estado. */
const CLASES: Record<EstadoReserva, string> = {
  [EstadoReserva.PENDIENTE]: 'bg-secondary',
  [EstadoReserva.CONFIRMADA]: 'bg-primary',
  [EstadoReserva.VALIDADA]: 'bg-success',
  [EstadoReserva.CANCELADA]: 'bg-danger',
  [EstadoReserva.EXPIRADA]: 'bg-dark',
  [EstadoReserva.REEMBOLSADA]: 'bg-warning text-dark',
};

export function etiquetaEstadoReserva(estado?: string): string {
  if (!estado) return '—';
  return ETIQUETAS[estado as EstadoReserva] ?? estado;
}

export function claseEstadoReserva(estado?: string): string {
  if (!estado) return 'bg-secondary';
  return CLASES[estado as EstadoReserva] ?? 'bg-secondary';
}
