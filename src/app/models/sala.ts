/** Respuesta de /api/salas (SalaResponseDTO). */
export interface Sala {
  id?: number;
  nombre: string;
  filas: number;
  columnas: number;
  capacidad?: number;
}

/** Body de POST /api/salas y PUT /api/salas/{id}. */
export interface SalaRequest {
  nombre: string;
  filas: number;
  columnas: number;
}
