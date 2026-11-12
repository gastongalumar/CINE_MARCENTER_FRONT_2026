import { expect, test } from '@playwright/test';
import { json, matchCommonGets, routeApi } from './helpers/api-mock';
import { setAuthSession } from './helpers/auth';
import { PELICULA, RESERVA } from './helpers/fixtures';

test.describe('Mis reservas', () => {
  test('cliente autenticado ve el listado mockeado', async ({ page }) => {
    await setAuthSession(page, 'CLIENTE');

    await routeApi(page, async (route, info) => {
      if (await matchCommonGets(route, info)) return true;

      if (info.method === 'GET' && info.path.endsWith('/api/reservas/mis')) {
        await json(route, 200, [RESERVA]);
        return true;
      }

      return false;
    });

    await page.goto('/mis-reservas');

    await expect(page.getByRole('heading', { name: 'Mis Compras' })).toBeVisible();
    await expect(page.getByText(RESERVA.numeroTicket)).toBeVisible();
    await expect(page.getByText(PELICULA.nombre)).toBeVisible();
    await expect(page.getByText('A1')).toBeVisible();
    await expect(page.getByRole('button', { name: /Ver Ticket/i })).toBeVisible();
  });
});
