import { Routes } from '@angular/router';
import { authGuard } from './guards/auth';
import { butacasAccessGuard } from './guards/butacas-access';
import { compraPagoGuard } from './guards/compra-pago';
import { funcionAccessGuard } from './guards/funcion-access';
import { roleGuard } from './guards/role';
import { ticketOwnerGuard } from './guards/ticket-owner';

/**
 * Rutas de la aplicación.
 *
 * Todas las features se cargan de forma diferida (`loadComponent`) para no
 * penalizar el bundle inicial. Las rutas `/admin/**` exigen rol
 * ADMINISTRADOR o SUPERADMIN mediante `roleGuard`.
 */
export const routes: Routes = [
    // ---------------------------------------------------------------- públicas
    {
        path: '',
        redirectTo: 'cartelera',
        pathMatch: 'full',
    },
    {
        path: 'login',
        title: 'Iniciar sesión | Cinemacenter',
        loadComponent: () => import('./pages/login/login').then((m) => m.LoginComponent),
    },
    {
        path: 'oauth2/redirect',
        title: 'Conectando con Google | Cinemacenter',
        loadComponent: () =>
            import('./pages/oauth2-redirect/oauth2-redirect').then(
                (m) => m.OAuth2RedirectComponent
            ),
    },
    {
        path: 'registro',
        title: 'Crear cuenta | Cinemacenter',
        loadComponent: () => import('./pages/registro/registro').then((m) => m.RegistroComponent),
    },
    {
        path: 'olvidar-password',
        title: 'Recuperar contraseña | Cinemacenter',
        loadComponent: () =>
            import('./pages/olvidar-password/olvidar-password').then((m) => m.OlvidarPasswordComponent),
    },
    {
        path: 'reset-password',
        title: 'Nueva contraseña | Cinemacenter',
        loadComponent: () =>
            import('./pages/reset-password/reset-password').then((m) => m.ResetPasswordComponent),
    },
    {
        path: 'cartelera',
        title: 'Inicio | Cinemacenter',
        loadComponent: () => import('./pages/cartelera/cartelera').then((m) => m.CarteleraComponent),
    },
    {
        path: 'pelicula/:id',
        title: 'Ficha de película | Cinemacenter',
        loadComponent: () =>
            import('./pages/pelicula-detalle/pelicula-detalle').then(
                (m) => m.PeliculaDetalleComponent
            ),
    },
    {
        path: 'contacto',
        title: 'Contacto | Cinemacenter',
        loadComponent: () => import('./pages/contacto/contacto').then((m) => m.ContactoComponent),
    },
    {
        path: 'contacto/cumpleanos',
        title: 'Cumpleaños | Cinemacenter',
        loadComponent: () =>
            import('./pages/contacto/cumpleanos').then((m) => m.CumpleanosComponent),
    },
    {
        path: 'contacto/candy',
        title: 'Candy Bar | Cinemacenter',
        loadComponent: () => import('./pages/contacto/candy').then((m) => m.CandyComponent),
    },
    {
        path: 'contacto/promos',
        title: 'Promociones | Cinemacenter',
        loadComponent: () => import('./pages/contacto/promos').then((m) => m.PromosComponent),
    },
    {
        path: 'welcome',
        redirectTo: 'cartelera',
        pathMatch: 'full',
    },

    // ------------------------------------------------------- clientes (auth)
    {
        path: 'butacas/:peliculaId/funcion/:funcionId/pago',
        title: 'Confirmar pago | Cinemacenter',
        loadComponent: () =>
            import('./pages/compra/compra-checkout').then((m) => m.CompraCheckoutComponent),
        canActivate: [authGuard, butacasAccessGuard, funcionAccessGuard, compraPagoGuard],
    },
    {
        path: 'butacas/:peliculaId/funcion/:funcionId',
        title: 'Elegir asientos | Cinemacenter',
        loadComponent: () =>
            import('./pages/compra/compra-asientos').then((m) => m.CompraAsientosComponent),
        canActivate: [authGuard, butacasAccessGuard, funcionAccessGuard],
    },
    {
        path: 'butacas/:peliculaId',
        title: 'Seleccionar horario | Cinemacenter',
        loadComponent: () =>
            import('./pages/compra/compra-horarios').then((m) => m.CompraHorariosComponent),
        // Público: ver horarios sin login. Asientos/pago siguen con authGuard.
        canActivate: [butacasAccessGuard],
    },
    {
        path: 'ticket/:numero',
        title: 'Tu ticket | Cinemacenter',
        loadComponent: () => import('./pages/ticket/ticket').then((m) => m.TicketComponent),
        canActivate: [authGuard, roleGuard('CLIENTE'), ticketOwnerGuard],
    },
    {
        path: 'mis-reservas',
        title: 'Mis reservas | Cinemacenter',
        loadComponent: () =>
            import('./pages/mis-reservas/mis-reservas').then((m) => m.MisReservasComponent),
        canActivate: [authGuard],
    },
    {
        path: 'perfil',
        title: 'Mi perfil | Cinemacenter',
        loadComponent: () => import('./pages/perfil/perfil').then((m) => m.PerfilComponent),
        canActivate: [authGuard],
    },
    {
        path: 'pago/exito',
        title: 'Pago exitoso | Cinemacenter',
        loadComponent: () =>
            import('./pages/pago-resultado/pago-resultado').then((m) => m.PagoResultadoComponent),
        canActivate: [authGuard],
        data: { estado: 'exito' },
    },
    {
        path: 'pago/error',
        title: 'Pago rechazado | Cinemacenter',
        loadComponent: () =>
            import('./pages/pago-resultado/pago-resultado').then((m) => m.PagoResultadoComponent),
        canActivate: [authGuard],
        data: { estado: 'error' },
    },
    {
        path: 'pago/pendiente',
        title: 'Pago pendiente | Cinemacenter',
        loadComponent: () =>
            import('./pages/pago-resultado/pago-resultado').then((m) => m.PagoResultadoComponent),
        canActivate: [authGuard],
        data: { estado: 'pendiente' },
    },

    // ------------------------------------------------------------- admin
    {
        path: 'admin',
        title: 'Panel de administración | Cinemacenter',
        loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.DashboardComponent),
        canActivate: [authGuard, roleGuard('ADMINISTRADOR', 'SUPERADMIN')],
    },
    {
        path: 'admin/peliculas/listado',
        title: 'Listado de películas | Cinemacenter',
        loadComponent: () =>
            import('./components/listado-peliculas/listado-peliculas').then(
                (m) => m.ListadoPeliculasComponent
            ),
        canActivate: [authGuard, roleGuard('ADMINISTRADOR', 'SUPERADMIN')],
    },
    {
        path: 'admin/peliculas',
        title: 'Gestión de películas | Cinemacenter',
        loadComponent: () =>
            import('./pages/peliculas/peliculas').then((m) => m.PeliculasComponent),
        canActivate: [authGuard, roleGuard('ADMINISTRADOR', 'SUPERADMIN')],
    },
    {
        path: 'admin/funciones/listado',
        title: 'Listado de funciones | Cinemacenter',
        loadComponent: () =>
            import('./components/listado-funciones/listado-funciones').then(
                (m) => m.ListadoFuncionesComponent
            ),
        canActivate: [authGuard, roleGuard('ADMINISTRADOR', 'SUPERADMIN')],
    },
    {
        path: 'admin/funciones',
        title: 'Gestión de funciones | Cinemacenter',
        loadComponent: () =>
            import('./pages/funciones/funciones').then((m) => m.FuncionesComponent),
        canActivate: [authGuard, roleGuard('ADMINISTRADOR', 'SUPERADMIN')],
    },
    {
        path: 'admin/salas/listado',
        title: 'Listado de salas | Cinemacenter',
        loadComponent: () =>
            import('./components/listado-salas/listado-salas').then((m) => m.ListadoSalasComponent),
        canActivate: [authGuard, roleGuard('ADMINISTRADOR', 'SUPERADMIN')],
    },
    {
        path: 'admin/salas',
        title: 'Gestión de salas | Cinemacenter',
        loadComponent: () => import('./pages/salas/salas').then((m) => m.SalasComponent),
        canActivate: [authGuard, roleGuard('ADMINISTRADOR', 'SUPERADMIN')],
    },
    {
        path: 'admin/candy',
        title: 'Combos Candy | Cinemacenter',
        loadComponent: () =>
            import('./pages/admin-candy/admin-candy').then((m) => m.AdminCandyComponent),
        canActivate: [authGuard, roleGuard('ADMINISTRADOR', 'SUPERADMIN')],
    },
    {
        path: 'admin/candy/nuevo',
        title: 'Nuevo combo | Cinemacenter',
        loadComponent: () =>
            import('./pages/admin-candy-form/admin-candy-form').then((m) => m.AdminCandyFormComponent),
        canActivate: [authGuard, roleGuard('ADMINISTRADOR', 'SUPERADMIN')],
    },
    {
        path: 'admin/candy/:id',
        title: 'Editar combo | Cinemacenter',
        loadComponent: () =>
            import('./pages/admin-candy-form/admin-candy-form').then((m) => m.AdminCandyFormComponent),
        canActivate: [authGuard, roleGuard('ADMINISTRADOR', 'SUPERADMIN')],
    },
    {
        path: 'admin/descuentos',
        title: 'Códigos de descuento | Cinemacenter',
        loadComponent: () =>
            import('./pages/admin-descuentos/admin-descuentos').then((m) => m.AdminDescuentosComponent),
        canActivate: [authGuard, roleGuard('ADMINISTRADOR', 'SUPERADMIN')],
    },
    {
        path: 'admin/descuentos/nuevo',
        title: 'Nuevo código de descuento | Cinemacenter',
        loadComponent: () =>
            import('./pages/admin-descuento-form/admin-descuento-form').then(
                (m) => m.AdminDescuentoFormComponent
            ),
        canActivate: [authGuard, roleGuard('ADMINISTRADOR', 'SUPERADMIN')],
    },
    {
        path: 'admin/descuentos/:id',
        title: 'Editar código de descuento | Cinemacenter',
        loadComponent: () =>
            import('./pages/admin-descuento-form/admin-descuento-form').then(
                (m) => m.AdminDescuentoFormComponent
            ),
        canActivate: [authGuard, roleGuard('ADMINISTRADOR', 'SUPERADMIN')],
    },
    {
        path: 'admin/usuarios',
        title: 'Gestión de usuarios | Cinemacenter',
        loadComponent: () => import('./pages/usuarios/usuarios').then((m) => m.UsuariosComponent),
        canActivate: [authGuard, roleGuard('ADMINISTRADOR', 'SUPERADMIN')],
    },
    {
        path: 'admin/validar-ticket',
        title: 'Validar ticket | Cinemacenter',
        loadComponent: () =>
            import('./pages/validar-ticket/validar-ticket').then((m) => m.ValidarTicketComponent),
        canActivate: [authGuard, roleGuard('ADMINISTRADOR', 'SUPERADMIN')],
    },
    {
        path: 'admin/crear-admin',
        title: 'Crear administrador | Cinemacenter',
        loadComponent: () =>
            import('./pages/crear-admin/crear-admin').then((m) => m.CrearAdminComponent),
        canActivate: [authGuard, roleGuard('SUPERADMIN')],
    },
    {
        path: 'admin/tema',
        title: 'Personalizar tema | Cinemacenter',
        loadComponent: () => import('./pages/tema/tema').then((m) => m.TemaComponent),
        canActivate: [authGuard, roleGuard('ADMINISTRADOR', 'SUPERADMIN')],
    },
    {
        path: 'admin/estadisticas',
        title: 'Estadísticas | Cinemacenter',
        loadComponent: () =>
            import('./pages/estadisticas/estadisticas').then((m) => m.EstadisticasComponent),
        canActivate: [authGuard, roleGuard('ADMINISTRADOR', 'SUPERADMIN')],
    },

    // --------------------------------------------------------- redirecciones
    { path: '**', redirectTo: 'cartelera' },
];
