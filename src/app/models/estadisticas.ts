/** DTOs de /api/estadisticas (todos con rol ADMINISTRADOR). */

/** GET /api/estadisticas/dashboard/resumen */
export interface DashboardResumen {
  totalReservas: number;
  totalEntradas: number;
  totalVentas: number;
  ventasHoy: number;
  totalPeliculas: number;
  totalFunciones: number;
  funcionesVigentes: number;
  totalSalas: number;
}

/** GET /api/estadisticas/reservas/por-fecha?dias= */
export interface VentaDiaria {
  /** yyyy-MM-dd */
  fecha: string;
  reservas: number;
  entradas: number;
  ventas: number;
}

/** GET /api/estadisticas/ocupacion/pelicula */
export interface VentaPelicula {
  peliculaId: number;
  peliculaNombre: string;
  totalReservas: number;
  totalEntradas: number;
  totalVentas: number;
}

/** GET /api/estadisticas/ocupacion/sala */
export interface VentaSala {
  salaId: number;
  salaNombre: string;
  capacidad: number;
  totalFunciones: number;
  totalEntradas: number;
  /** 0-100 */
  pctOcupacion: number;
  totalVentas: number;
}

/** GET /api/estadisticas/ocupacion/funcion?soloVigentes= */
export interface OcupacionFuncion {
  funcionId: number;
  peliculaNombre: string;
  salaNombre: string;
  horario: string;
  precio: number;
  asientosOcupados: number;
  capacidad: number;
  /** 0-100 */
  pctOcupacion: number;
  totalVentas: number;
}

/** GET /api/estadisticas/ingresos/metodos-pago */
export interface MetodoPagoEstadistica {
  metodo: string;
  cantidad: number;
  /** 0-100 */
  porcentaje: number;
}
