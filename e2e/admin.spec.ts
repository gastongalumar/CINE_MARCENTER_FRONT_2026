import { expect, test } from '@playwright/test';
import { json, matchCommonGets, routeApi } from './helpers/api-mock';
import { setAuthSession } from './helpers/auth';
import { DASHBOARD_RESUMEN, PELICULA, VENTAS_DIARIAS } from './helpers/fixtures';

async function mockAdminApis(page: Parameters<typeof routeApi>[0]): Promise<void> {
  await routeApi(page, async (route, info) => {
    if (await matchCommonGets(route, info)) return true;

    if (info.method === 'GET' && info.path.endsWith('/api/estadisticas/dashboard/resumen')) {
      await json(route, 200, DASHBOARD_RESUMEN);
      return true;
    }
    if (info.method === 'GET' && info.path.includes('/api/estadisticas/reservas/por-fecha')) {
      await json(route, 200, VENTAS_DIARIAS);
      return true;
    }
    if (info.method === 'GET' && info.path.includes('/api/estadisticas/')) {
      await json(route, 200, []);
      return true;
    }

    if (info.method === 'GET' && info.path.endsWith('/api/peliculas')) {
      await json(route, 200, [PELICULA]);
      return true;
    }
    if (info.method === 'GET' && info.path.endsWith('/api/peliculas/vigentes')) {
      await json(route, 200, [PELICULA]);
      return true;
    }
    if (info.method === 'GET' && info.path.endsWith('/api/salas')) {
      await json(route, 200, [
        { id: 1, nombre: 'Sala 1', filas: 8, columnas: 10, capacidad: 80 },
      ]);
      return true;
    }

    if (info.method === 'GET' && info.path.includes('/api/usuarios/rol/')) {
      await json(route, 200, []);
      return true;
    }

    if (
      info.method === 'POST' &&
      /\/api\/reservas\/validar\//.test(info.path)
    ) {
      await json(route, 200, {
        numeroTicket: 'TK1748039201234',
        estado: 'VALIDADO_AHORA',
        mensaje: 'Ticket válido. Ingreso autorizado.',
        montoTotal: 3500,
        asientos: ['A1'],
      });
      return true;
    }

    return false;
  });
}

test.describe('Admin (P1)', () => {
  test('smoke CRUD: películas, salas y validar-ticket', async ({ page }) => {
    await setAuthSession(page, 'ADMINISTRADOR');
    await mockAdminApis(page);

    await page.goto('/admin/peliculas');
    await expect(page.getByRole('heading', { name: 'Gestión de Películas' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Nueva película' })).toBeVisible();

    await page.goto('/admin/salas');
    await expect(page.getByRole('heading', { name: 'Gestión de Salas' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Nueva sala' })).toBeVisible();

    await page.goto('/admin/validar-ticket');
    await expect(page.getByRole('heading', { name: 'Validar Ticket' })).toBeVisible();
    await expect(page.getByLabel('Número de ticket')).toBeVisible();
    await expect(page.getByLabel('Marcar como usado al validar')).toBeChecked();

    await page.getByLabel('Número de ticket').fill('TK1748039201234');
    await page.getByRole('button', { name: 'Validar ticket' }).click();
    await expect(page.getByRole('main').getByText('Ticket válido. Ingreso autorizado.')).toBeVisible();
    await expect(page.getByRole('main').getByText('Validado ahora')).toBeVisible();
  });

  test('crear-admin: ADMINISTRADOR es redirigido a cartelera', async ({ page }) => {
    await setAuthSession(page, 'ADMINISTRADOR');
    await mockAdminApis(page);

    await page.goto('/admin/crear-admin');
    await expect(page).toHaveURL(/\/cartelera/);
    await expect(page.getByRole('heading', { name: 'Cartelera de Películas' })).toBeVisible();
  });

  test('crear-admin: SUPERADMIN ve la página', async ({ page }) => {
    await setAuthSession(page, 'SUPERADMIN');
    await mockAdminApis(page);

    await page.goto('/admin/crear-admin');
    await expect(page).toHaveURL(/\/admin\/crear-admin/);
    await expect(page.locator('h2.admin-page-title')).toContainText('Administradores');
    await expect(page.getByRole('heading', { name: 'Crear nuevo administrador' })).toBeVisible();
  });

  test('estadísticas carga con endpoints mockeados', async ({ page }) => {
    await setAuthSession(page, 'ADMINISTRADOR');
    await mockAdminApis(page);

    await page.goto('/admin/estadisticas');
    await expect(page.getByRole('heading', { name: 'Estadísticas y Reportes' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Secciones de reportes' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ventas diarias' })).toBeVisible();
    await expect(page.getByText('10/11/2026')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('cell', { name: 'TOTAL' })).toBeVisible();
  });
});
