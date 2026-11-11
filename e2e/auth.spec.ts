import { expect, test } from '@playwright/test';
import { authBody, json, matchCommonGets, routeApi } from './helpers/api-mock';
import { FUNCION, PELICULA } from './helpers/fixtures';

test.describe('Auth (P0)', () => {
  test('login con credenciales inválidas muestra error y permanece en /login', async ({
    page,
  }) => {
    await routeApi(page, async (route, info) => {
      if (await matchCommonGets(route, info)) return true;

      if (info.method === 'POST' && info.path.endsWith('/api/auth/login')) {
        await json(route, 401, { message: 'Credenciales inválidas' });
        return true;
      }

      if (info.method === 'GET' && info.path.endsWith('/api/peliculas/vigentes')) {
        await json(route, 200, []);
        return true;
      }
      if (info.method === 'GET' && info.path.endsWith('/api/peliculas')) {
        await json(route, 200, []);
        return true;
      }

      return false;
    });

    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Iniciar Sesión' })).toBeVisible();

    await page.getByLabel('Correo electrónico').fill('malo@test.com');
    await page.locator('#password').fill('wrong-password');
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(page.getByText('Credenciales inválidas')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('login cliente navega a cartelera', async ({ page }) => {
    await routeApi(page, async (route, info) => {
      if (await matchCommonGets(route, info)) return true;

      if (info.method === 'POST' && info.path.endsWith('/api/auth/login')) {
        await json(route, 200, authBody('CLIENTE'));
        return true;
      }

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

    await page.goto('/login');
    await page.getByLabel('Correo electrónico').fill('cliente@test.com');
    await page.locator('#password').fill('secret123');
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(page).toHaveURL(/\/cartelera/);
    await expect(page.getByRole('heading', { name: 'Cartelera de Películas' })).toBeVisible();
  });

  test('login cliente respeta returnUrl de butacas', async ({ page }) => {
    await routeApi(page, async (route, info) => {
      if (await matchCommonGets(route, info)) return true;

      if (info.method === 'POST' && info.path.endsWith('/api/auth/login')) {
        await json(route, 200, authBody('CLIENTE'));
        return true;
      }

      if (
        info.method === 'GET' &&
        info.path.endsWith(`/api/funciones/pelicula/${PELICULA.id}`)
      ) {
        await json(route, 200, [FUNCION]);
        return true;
      }

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

    await page.goto(`/login?returnUrl=/butacas/${PELICULA.id}`);
    await page.getByLabel('Correo electrónico').fill('cliente@test.com');
    await page.locator('#password').fill('secret123');
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(page).toHaveURL(new RegExp(`/butacas/${PELICULA.id}`));
    await expect(page.getByRole('heading', { name: 'Seleccionar Horario' })).toBeVisible();
  });

  test('login admin navega a /admin', async ({ page }) => {
    await routeApi(page, async (route, info) => {
      if (await matchCommonGets(route, info)) return true;

      if (info.method === 'POST' && info.path.endsWith('/api/auth/login')) {
        await json(route, 200, authBody('ADMINISTRADOR'));
        return true;
      }

      if (info.method === 'GET' && info.path.includes('/api/estadisticas/')) {
        if (info.path.endsWith('/dashboard/resumen')) {
          await json(route, 200, {
            totalReservas: 0,
            totalEntradas: 0,
            totalVentas: 0,
            ventasHoy: 0,
            totalPeliculas: 0,
            totalFunciones: 0,
            funcionesVigentes: 0,
            totalSalas: 0,
          });
          return true;
        }
        await json(route, 200, []);
        return true;
      }

      return false;
    });

    await page.goto('/login');
    await page.getByLabel('Correo electrónico').fill('admin@test.com');
    await page.locator('#password').fill('secret123');
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole('heading', { name: 'Panel de Administración' })).toBeVisible();
  });
});
