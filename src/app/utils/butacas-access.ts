/** Clave de sessionStorage para el ticket de acceso a `/butacas/:peliculaId`. */
const STORAGE_KEY_PELICULA = 'cine.butacas.peliculaId';

/** Clave de sessionStorage para el ticket de acceso a una función concreta. */
const STORAGE_KEY_FUNCION = 'cine.butacas.funcionId';

/** Marca que el usuario puede entrar a butacas de esa película (sobrevive F5). */
export function autorizarButacas(peliculaId: number): void {
  if (!Number.isFinite(peliculaId) || peliculaId <= 0) return;
  try {
    sessionStorage.setItem(STORAGE_KEY_PELICULA, String(peliculaId));
  } catch {
    // sessionStorage puede no estar disponible
  }
}

/** true si hay ticket y coincide con el id de la ruta. */
export function puedeAccederButacas(peliculaId: number): boolean {
  if (!Number.isFinite(peliculaId) || peliculaId <= 0) return false;
  try {
    return sessionStorage.getItem(STORAGE_KEY_PELICULA) === String(peliculaId);
  } catch {
    return false;
  }
}

/** Marca que el usuario puede entrar a esa función (sobrevive F5). */
export function autorizarFuncion(funcionId: number): void {
  if (!Number.isFinite(funcionId) || funcionId <= 0) return;
  try {
    sessionStorage.setItem(STORAGE_KEY_FUNCION, String(funcionId));
  } catch {
    // sessionStorage puede no estar disponible
  }
}

/** true si hay ticket y coincide con el funcionId de la ruta. */
export function puedeAccederFuncion(funcionId: number): boolean {
  if (!Number.isFinite(funcionId) || funcionId <= 0) return false;
  try {
    return sessionStorage.getItem(STORAGE_KEY_FUNCION) === String(funcionId);
  } catch {
    return false;
  }
}

/** Quita la autorización de función (p.ej. al volver a horarios). */
export function limpiarFuncionAutorizada(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY_FUNCION);
  } catch {
    // sessionStorage puede no estar disponible
  }
}

/**
 * Extrae el id de película de URLs tipo:
 * `/butacas/12`, `/butacas/12/funcion/3`, `/butacas/12/funcion/3/pago`
 */
export function peliculaIdDesdeButacasUrl(url: string): number | null {
  const match = url.match(/^\/butacas\/(\d+)(?:\/|\?|$)/);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isFinite(id) && id > 0 ? id : null;
}

/**
 * Extrae el id de función de URLs tipo:
 * `/butacas/12/funcion/5`, `/butacas/12/funcion/5/pago`
 */
export function funcionIdDesdeButacasUrl(url: string): number | null {
  const match = url.match(/^\/butacas\/\d+\/funcion\/(\d+)(?:\/|\?|$)/);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isFinite(id) && id > 0 ? id : null;
}
