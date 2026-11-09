import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Rutas del servidor SSR.
 *
 * La aplicación es 100% client-side (la sesión se guarda en `sessionStorage`
 * y el token JWT se decodifica en el navegador), por lo que **todas** las
 * rutas se renderizan en el cliente: el servidor sólo entrega el shell de
 * la SPA y el enrutador del lado del cliente resuelve la vista.
 */
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Client,
  },
];
