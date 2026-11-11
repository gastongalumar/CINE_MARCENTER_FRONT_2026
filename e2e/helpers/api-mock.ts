import type { Page, Route } from '@playwright/test';

export type TipoUsuarioMock = 'CLIENTE' | 'ADMINISTRADOR' | 'SUPERADMIN';

export async function json(route: Route, status: number, body: unknown): Promise<void> {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

/** Mock genérico de API: responde 404 a todo salvo rutas registradas por el spec. */
export async function stubUnhandledApi(page: Page): Promise<void> {
  await page.route('**/api/**', async (route) => {
    await json(route, 404, { message: 'No mock for ' + route.request().url() });
  });
}

/**
 * Un solo handler para `/api/**`. Devolver `true` si respondió la request;
 * si devuelve `false`, se cumple 404 (mismo efecto que stubUnhandledApi).
 *
 * Preferible a varios `page.route`: evita pelearse con el orden LIFO de Playwright.
 */
export async function routeApi(
  page: Page,
  handle: (route: Route, info: { method: string; path: string; url: URL }) => Promise<boolean>,
): Promise<void> {
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/\/+$/, '') || '/';
    const handled = await handle(route, {
      method: route.request().method().toUpperCase(),
      path,
      url,
    });
    if (!handled) {
      await json(route, 404, { message: 'No mock for ' + route.request().url() });
    }
  });
}

export function fakeJwt(tipo: TipoUsuarioMock = 'CLIENTE'): string {
  const now = Math.floor(Date.now() / 1000);
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
  const payload = btoa(
    JSON.stringify({
      sub: `${tipo.toLowerCase()}@test.com`,
      tipo,
      userId: tipo === 'CLIENTE' ? 1 : 99,
      nombre: 'QA',
      apellido: 'Test',
      nombreCompleto: 'QA Test',
      iat: now,
      exp: now + 3600,
    }),
  )
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
  return `${header}.${payload}.fakesig`;
}

/** Forma de AuthResponse que espera el front tras login/registro. */
export function authBody(tipo: TipoUsuarioMock = 'CLIENTE') {
  const token = fakeJwt(tipo);
  return {
    token,
    tipo,
    email: `${tipo.toLowerCase()}@test.com`,
    nombre: 'QA Test',
    id: tipo === 'CLIENTE' ? 1 : 99,
  };
}

export const TEMA_MOCK = {
  colorFondo: '#6E0A17',
  colorContenedor: '#0A6E61',
  colorFuente: '#FFFFFF',
  colorSlider: '#ffcc00',
  tamanoFuenteTitulos: '20px',
  tamanoFuenteTexto: '14px',
  efectoFestivo: 'ninguno' as const,
};

/** Responde GET /api/customizacion y deja el resto al caller. */
export async function matchCommonGets(
  route: Route,
  info: { method: string; path: string },
): Promise<boolean> {
  if (info.method === 'GET' && info.path.endsWith('/api/customizacion')) {
    await json(route, 200, TEMA_MOCK);
    return true;
  }
  return false;
}

