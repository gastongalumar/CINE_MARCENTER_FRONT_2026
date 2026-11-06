/** Respuesta de /api/funciones (FuncionResponseDTO). */
export interface Funcion {
  id?: number;
  salaId: number;
  salaNombre?: string;
  salaFilas?: number;
  salaColumnas?: number;
  peliculaId: number;
  peliculaNombre?: string;
  /** ISO local sin zona: "2026-06-15T20:00:00" */
  horario: string;
  precio: number;
}

/** Body de POST /api/funciones (CrearFuncionRequestDTO). */
export interface FuncionRequest {
  salaId: number;
  peliculaId: number;
  /** Valor de <input type="datetime-local">: "2026-06-15T20:00" */
  horario: string;
  precio: number;
}

/** Body de POST /api/funciones/por-rango (CrearFuncionesPorRangoRequestDTO). */
export interface FuncionRangoRequest {
  salaId: number;
  peliculaId: number;
  /** yyyy-MM-dd */
  fechaDesde: string;
  /** yyyy-MM-dd */
  fechaHasta: string;
  /** HH:mm */
  horaInicio: string;
  /** HH:mm */
  horaFin: string;
  precio: number;
}
