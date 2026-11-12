import { expect, test } from '@playwright/test';
import { fakeJwt, json, matchCommonGets, routeApi } from './helpers/api-mock';
import { setAuthSession } from './helpers/auth';
import { PELICULA, RESERVA } from './helpers/fixtures';

test.describe('OAuth y pago resultado (P0)', () => {
  test('oauth2/redirect con token válido deja sesión y va a cartelera', async ({ page }) => {
    const token = fakeJwt('CLIENTE');

    await routeApi(page, async (route, info) => {
      if (await matchCommonGets(route, info)) return true;
      if (info.method === 'GET' && info.path.endsWith('/api/peliculas/vigentes')) {
        await json(route, 200, [PELICULA]);
        return true;
      }
      if (info.method === 'GET' && info.path.endsWith('/api/peliculas')) {
        await json(route, 200, [PELICULA]);
        return true;
      }
      return false;
    });

    await page.goto(`/oauth2/redirect?token=${encodeURIComponent(token)}`);

    await expect(page).toHaveURL(/\/cartelera/, { timeout: 30_000 });
    await expect(page.getByRole('heading', { name: 'Cartelera de Películas' })).toBeVisible();

    const stored = await page.evaluate(() => sessionStorage.getItem('access_token'));
    expect(stored).toBe(token);
  });

  test('oauth2/redirect inválido redirige a login?error=google', async ({ page }) => {
    await routeApi(page, async (route, info) => {
      if (await matchCommonGets(route, info)) return true;
      return false;
    });

    await page.goto('/oauth2/redirect');

    await expect(page).toHaveURL(/\/login\?error=google/);
    await expect(
      page.getByText('No se pudo iniciar sesión con Google. Intentá de nuevo.'),
    ).toBeVisible();
  });

  test('/pago/exito muestra reserva según external_reference', async ({ page }) => {
    await setAuthSession(page, 'CLIENTE');

    await routeApi(page, async (route, info) => {
      if (await matchCommonGets(route, info)) return true;

      if (info.method === 'GET' && info.path.endsWith('/api/reservas/mis')) {
        await json(route, 200, [RESERVA]);
        return true;
      }

      return false;
    });

    await page.goto(`/pago/exito?external_reference=${RESERVA.id}`);

    await expect(page.getByRole('heading', { name: '¡Pago aprobado!' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(RESERVA.numeroTicket)).toBeVisible();
    await expect(page.getByText(PELICULA.nombre)).toBeVisible();
    await expect(page.getByText('La reserva quedó registrada como PAGADA.')).toBeVisible();
  });
});
