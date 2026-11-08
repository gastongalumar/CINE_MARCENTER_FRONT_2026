/** Fecha local en formato yyyy-MM-dd (sin desfase UTC). */
export function fechaLocalIso(fecha: Date = new Date()): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Hora local HH:mm. */
export function horaLocalIso(fecha: Date = new Date()): string {
  const h = String(fecha.getHours()).padStart(2, '0');
  const min = String(fecha.getMinutes()).padStart(2, '0');
  return `${h}:${min}`;
}

/** Valor para input datetime-local en hora local. */
export function fechaHoraLocalIso(fecha: Date = new Date()): string {
  return `${fechaLocalIso(fecha)}T${horaLocalIso(fecha)}`;
}

/** Formato legible es-AR: "24 oct 2026". */
export function formatearFechaCorta(isoDate: string): string {
  if (!isoDate || isoDate.length < 10) return '';
  const parsed = new Date(`${isoDate.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Días inclusivos entre dos fechas yyyy-MM-dd. */
export function diasInclusive(desde: string, hasta: string): number | null {
  if (!desde || !hasta || hasta < desde) return null;
  const a = new Date(`${desde}T00:00:00`);
  const b = new Date(`${hasta}T00:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  return Math.floor((b.getTime() - a.getTime()) / 86_400_000) + 1;
}

/**
 * Parsea fechas/horas de la API sin aplicar desfase UTC.
 * Ej.: "2026-06-15T20:00:00" → 20:00 local.
 */
export function parseApiDateTime(value: string): Date | null {
  if (!value) return null;

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (match) {
    const [, y, mo, d, h = '0', mi = '0', s = '0'] = match;
    return new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s));
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function parseHoraAMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function minutosAHora( minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export interface PreviewHorariosDia {
  inicios: string[];
  ultimoRechazado?: { inicio: string; fin: string };
}

/**
 * Réplica de POST /funciones/por-rango: funciones consecutivas cuya proyección
 * completa (inicio + duración) no supera horaFin.
 */
export function calcularHorariosPorDia(
  horaInicio: string,
  horaFin: string,
  duracionMinutos: number
): PreviewHorariosDia {
  if (!horaInicio || !horaFin || duracionMinutos <= 0) {
    return { inicios: [] };
  }

  const inicioMin = parseHoraAMinutos(horaInicio);
  const finMin = parseHoraAMinutos(horaFin);
  const inicios: string[] = [];
  let actual = inicioMin;

  while (actual + duracionMinutos <= finMin) {
    inicios.push(minutosAHora(actual));
    actual += duracionMinutos;
  }

  const ultimoRechazado =
    actual < finMin + duracionMinutos && actual + duracionMinutos > finMin
      ? { inicio: minutosAHora(actual), fin: minutosAHora(actual + duracionMinutos) }
      : undefined;

  return { inicios, ultimoRechazado };
}
