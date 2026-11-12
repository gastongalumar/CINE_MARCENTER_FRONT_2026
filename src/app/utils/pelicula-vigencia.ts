import { fechaLocalIso } from './datetime';

/**
 * true si la película aún no “pasó” de cartelera:
 * fechaSalida >= hoy (incluye estrenos futuros).
 */
export function esPeliculaNoPasada(
  pelicula: { fechaSalida?: string | null },
  hoy: string = fechaLocalIso()
): boolean {
  const salida = (pelicula.fechaSalida || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(salida)) return false;
  return salida >= hoy;
}
