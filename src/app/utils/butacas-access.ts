/** Clave de sessionStorage para el ticket de acceso a `/butacas/:id`. */
const STORAGE_KEY = 'cine.butacas.peliculaId';

/** Marca que el usuario puede entrar a butacas de esa película (sobrevive F5). */
export function autorizarButacas(peliculaId: number): void {
  if (!Number.isFinite(peliculaId) || peliculaId <= 0) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, String(peliculaId));
  } catch {
    // sessionStorage puede no estar disponible
  }
}

/** true si hay ticket y coincide con el id de la ruta. */
export function puedeAccederButacas(peliculaId: number): boolean {
  if (!Number.isFinite(peliculaId) || peliculaId <= 0) return false;
  try {
    return sessionStorage.getItem(STORAGE_KEY) === String(peliculaId);
  } catch {
    return false;
  }
}

/** Extrae el id de película de una URL tipo `/butacas/12` o `/butacas/12?...`. */
export function peliculaIdDesdeButacasUrl(url: string): number | null {
  const match = url.match(/^\/butacas\/(\d+)(?:\?|$)/);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isFinite(id) && id > 0 ? id : null;
}
