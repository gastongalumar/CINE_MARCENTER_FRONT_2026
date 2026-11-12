/** Datos de dominio reutilizados por los specs e2e (sin backend). */

export const PELICULA = {
  id: 1,
  nombre: 'Matrix Reloaded QA',
  genero: 'ACCION',
  fechaEstreno: '2026-01-10',
  fechaSalida: '2026-12-31',
  duracionMinutos: 138,
  sinopsis: 'Película de prueba para e2e.',
  clasificacion: 'ATP',
};

/** Horario de hoy a las 23:30 local (aparece en el día seleccionado por defecto). */
function horarioHoyTarde(): string {
  const d = new Date();
  d.setHours(23, 30, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

export const FUNCION = {
  id: 10,
  salaId: 2,
  salaNombre: 'Sala 1',
  salaFilas: 5,
  salaColumnas: 10,
  peliculaId: PELICULA.id,
  peliculaNombre: PELICULA.nombre,
  horario: horarioHoyTarde(),
  precio: 3500,
};

export const RESERVA = {
  id: 55,
  numeroTicket: 'TK1748039201234',
  clienteId: 1,
  clienteNombre: 'QA Test',
  funcionId: FUNCION.id,
  peliculaNombre: PELICULA.nombre,
  salaNombre: FUNCION.salaNombre,
  horarioFuncion: FUNCION.horario,
  montoTotal: 3500,
  metodoPago: 'MERCADO_PAGO',
  fechaEmision: '2026-11-11T12:00:00',
  estadoReserva: 'CONFIRMADA',
  pagada: true,
  asientosSeleccionados: ['A1'],
};

export const DASHBOARD_RESUMEN = {
  totalReservas: 12,
  totalEntradas: 30,
  totalVentas: 105000,
  ventasHoy: 7000,
  totalPeliculas: 4,
  totalFunciones: 8,
  funcionesVigentes: 3,
  totalSalas: 2,
};

export const VENTAS_DIARIAS = [
  { fecha: '2026-11-10', reservas: 2, entradas: 4, ventas: 14000 },
  { fecha: '2026-11-11', reservas: 3, entradas: 6, ventas: 21000 },
];
