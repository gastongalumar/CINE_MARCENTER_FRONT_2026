import { expect, test } from '@playwright/test';
import { json, matchCommonGets, routeApi } from './helpers/api-mock';
import { setAuthSession, setButacasTickets } from './helpers/auth';
import { FUNCION, PELICULA, RESERVA } from './helpers/fixtures';

async function mockCompraApis(
  page: Parameters<typeof routeApi>[0],
  opts: { holdsOk?: boolean } = {},
): Promise<void> {
  const holdsOk = opts.holdsOk !== false;
  let holdId = 1;

  await routeApi(page, async (route, info) => {
    if (await matchCommonGets(route, info)) return true;

    if (info.method === 'GET' && info.path.endsWith('/api/peliculas/vigentes')) {
      await json(route, 200, [PELICULA]);
      return true;
    }
    if (info.method === 'GET' && info.path.endsWith(`/api/peliculas/${PELICULA.id}`)) {
      await json(route, 200, PELICULA);
      return true;
    }
    if (info.method === 'GET' && info.path.endsWith('/api/peliculas')) {
      await json(route, 200, [PELICULA]);
      return true;
    }

    if (
      info.method === 'GET' &&
      info.path.endsWith(`/api/funciones/pelicula/${PELICULA.id}`)
    ) {
      await json(route, 200, [FUNCION]);
      return true;
    }
    if (info.method === 'GET' && info.path.endsWith(`/api/funciones/${FUNCION.id}`)) {
      await json(route, 200, FUNCION);
      return true;
    }
    if (
      info.method === 'GET' &&
      info.path.endsWith(`/api/funciones/${FUNCION.id}/estado-asientos`)
    ) {
      await json(route, 200, { ocupados: [], bloqueados: [], misBloqueados: [] });
      return true;
    }

    if (info.method === 'POST' && info.path.endsWith('/api/holds')) {
      if (!holdsOk) {
        await json(route, 409, { message: 'Asiento no disponible' });
        return true;
      }
      const body = route.request().postDataJSON() as { funcionId: number; etiqueta: string };
      await json(route, 200, {
        id: holdId++,
        funcionId: body.funcionId,
        etiqueta: body.etiqueta,
        expiresAt: '2026-12-15T20:10:00',
      });
      return true;
    }
    if (info.method === 'DELETE' && info.path.includes('/api/holds')) {
      await json(route, 200, { mensaje: 'ok' });
      return true;
    }

    if (info.method === 'GET' && info.path.endsWith('/api/candy-combos/activos')) {
      await json(route, 200, []);
      return true;
    }

    if (info.method === 'POST' && info.path.endsWith('/api/reservas')) {
      await json(route, 201, RESERVA);
      return true;
    }

    if (info.method === 'POST' && info.path.endsWith('/api/pagos/crear-preferencia')) {
      await json(route, 200, {
        init_point: 'https://example.com/mp',
        preference_id: 'pref-qa',
      });
      return true;
    }

    return false;
  });
}

test.describe('Compra (P0)', () => {
  test('funnel cartelera → horarios → asientos → checkout con mocks', async ({ page }) => {
    await setAuthSession(page, 'CLIENTE');
    await mockCompraApis(page);

    await page.goto('/cartelera');
    await expect(page.getByRole('heading', { name: 'Cartelera de Películas' })).toBeVisible();
    await expect(page.getByText(PELICULA.nombre).first()).toBeVisible();

    await page.getByRole('button', { name: /Ver Funciones/i }).first().click();
    await expect(page).toHaveURL(new RegExp(`/butacas/${PELICULA.id}`));
    await expect(page.getByRole('heading', { name: 'Seleccionar Horario' })).toBeVisible();
    await expect(page.getByText(PELICULA.nombre)).toBeVisible();

    const chip = page.locator('button.horario-chip').first();
    if (!(await chip.isVisible().catch(() => false))) {
      await page.getByRole('button', { name: /Elegir otro día/i }).click();
      await page.locator('.dia-chip').first().click();
    }
    await page.locator('button.horario-chip').first().click();
    await expect(page).toHaveURL(
      new RegExp(`/butacas/${PELICULA.id}/funcion/${FUNCION.id}$`),
    );
    await expect(page.getByRole('heading', { name: 'Elegir Asientos' })).toBeVisible();

    await page.getByRole('button', { name: 'A1', exact: true }).click();
    await expect(page.getByText('A1').first()).toBeVisible();

    await page.getByRole('button', { name: /Continuar al Pago/i }).click();
    await expect(page).toHaveURL(
      new RegExp(`/butacas/${PELICULA.id}/funcion/${FUNCION.id}/pago`),
    );
    await expect(page.getByRole('heading', { name: 'Confirmar pago' })).toBeVisible();
    await expect(page.getByText(PELICULA.nombre)).toBeVisible();
  });

  test('deep-link /butacas/1 sin ticket de sesión redirige a cartelera', async ({ page }) => {
    await setAuthSession(page, 'CLIENTE');
    await mockCompraApis(page);

    await page.goto('/butacas/1');
    await expect(page).toHaveURL(/\/cartelera/);
    await expect(page.getByRole('heading', { name: 'Cartelera de Películas' })).toBeVisible();
  });

  test('admin no puede acceder a pago', async ({ page }) => {
    await setAuthSession(page, 'ADMINISTRADOR');
    await setButacasTickets(page, PELICULA.id, FUNCION.id);
    await mockCompraApis(page);

    await page.goto(`/butacas/${PELICULA.id}/funcion/${FUNCION.id}/pago`);

    await expect(page).toHaveURL(
      new RegExp(`/butacas/${PELICULA.id}/funcion/${FUNCION.id}$`),
    );
    await expect(page.getByRole('heading', { name: 'Ocupación de la Función' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Confirmar pago' })).toHaveCount(0);
  });
});
