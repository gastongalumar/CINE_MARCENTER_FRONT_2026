import type { Page } from '@playwright/test';
import { fakeJwt, type TipoUsuarioMock } from './api-mock';

/** Clave real usada por AuthService (`TOKEN_STORAGE_KEY`). */
export const ACCESS_TOKEN_KEY = 'access_token';

/** Claves de butacas-access (sessionStorage). */
export const BUTACAS_PELICULA_KEY = 'cine.butacas.peliculaId';
export const BUTACAS_FUNCION_KEY = 'cine.butacas.funcionId';

/**
 * Inyecta el JWT en sessionStorage antes de que Angular arranque.
 * Usar en tests que necesitan sesión sin pasar por el formulario de login.
 */
export async function setAuthSession(
  page: Page,
  tipo: TipoUsuarioMock = 'CLIENTE',
  token?: string,
): Promise<string> {
  const jwt = token ?? fakeJwt(tipo);
  await page.addInitScript(
    ({ key, value }) => {
      try {
        sessionStorage.setItem(key, value);
      } catch {
        // sessionStorage puede fallar en contextos restringidos
      }
    },
    { key: ACCESS_TOKEN_KEY, value: jwt },
  );
  return jwt;
}

/** Autoriza deep-links a `/butacas/:peliculaId[/funcion/:funcionId...]`. */
export async function setButacasTickets(
  page: Page,
  peliculaId: number,
  funcionId?: number,
): Promise<void> {
  await page.addInitScript(
    ({ peliculaKey, funcionKey, peliculaId: pId, funcionId: fId }) => {
      try {
        sessionStorage.setItem(peliculaKey, String(pId));
        if (fId != null) {
          sessionStorage.setItem(funcionKey, String(fId));
        }
      } catch {
        // ignore
      }
    },
    {
      peliculaKey: BUTACAS_PELICULA_KEY,
      funcionKey: BUTACAS_FUNCION_KEY,
      peliculaId,
      funcionId: funcionId ?? null,
    },
  );
}
