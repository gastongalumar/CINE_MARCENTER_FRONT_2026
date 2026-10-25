/** Respuesta de GET /api/salas/{id}/asientos (AsientoResponseDTO). */
export interface Asiento {
  id?: number;
  fila: number;
  columna: number;
  /** Etiqueta legible: "A1", "B12" */
  etiqueta: string;
}

export type EstadoAsiento = 'LIBRE' | 'SELECCIONADO' | 'OCUPADO';
