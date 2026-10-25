import { Routes } from '@angular/router';
// import { authGuard } from './guards/auth.guard';
// import { roleGuard } from './guards/role.guard';

export const routes: Routes = [];

// Activar cada ruta cuando se hayan copiado sus componentes, guards y servicios:
//
// export const routes: Routes = [
//   {
//     path: '',
//     title: 'Inicio | Cinemacenter',
//     loadComponent: () => import('./components/home/home').then((m) => m.WelcomeComponent),
//   },
//   {
//     path: 'login',
//     title: 'Iniciar sesión | Cinemacenter',
//     loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
//   },
//   {
//     path: 'oauth2/redirect',
//     title: 'Conectando con Google | Cinemacenter',
//     loadComponent: () =>
//       import('./pages/oauth2-redirect/oauth2-redirect.component').then(
//         (m) => m.OAuth2RedirectComponent
//       ),
//   },
//   {
//     path: 'registro',
//     title: 'Crear cuenta | Cinemacenter',
//     loadComponent: () => import('./pages/registro/registro.component').then((m) => m.RegistroComponent),
//   },
//   {
//     path: 'cartelera',
//     title: 'Cartelera | Cinemacenter',
//     loadComponent: () => import('./pages/cartelera/cartelera.component').then((m) => m.CarteleraComponent),
//   },
//   { path: 'welcome', redirectTo: '', pathMatch: 'full' },
//   {
//     path: 'butacas/:id',
//     title: 'Elegir asientos | Cinemacenter',
//     loadComponent: () =>
//       import('./pages/seleccion-asientos/seleccion-asientos.component').then(
//         (m) => m.SeleccionAsientosComponent
//       ),
//     canActivate: [authGuard],
//   },
//   {
//     path: 'ticket/:numero',
//     title: 'Tu ticket | Cinemacenter',
//     loadComponent: () => import('./pages/ticket/ticket.component').then((m) => m.TicketComponent),
//     canActivate: [authGuard],
//   },
//   {
//     path: 'mis-reservas',
//     title: 'Mis reservas | Cinemacenter',
//     loadComponent: () =>
//       import('./pages/mis-reservas/mis-reservas.component').then((m) => m.MisReservasComponent),
//     canActivate: [authGuard],
//   },
//   {
//     path: 'perfil',
//     title: 'Mi perfil | Cinemacenter',
//     loadComponent: () => import('./pages/perfil/perfil.component').then((m) => m.PerfilComponent),
//     canActivate: [authGuard],
//   },
//   {
//     path: 'pago/exito',
//     title: 'Pago exitoso | Cinemacenter',
//     loadComponent: () =>
//       import('./pages/pago-resultado/pago-resultado.component').then((m) => m.PagoResultadoComponent),
//     canActivate: [authGuard],
//     data: { estado: 'exito' },
//   },
//   {
//     path: 'pago/error',
//     title: 'Pago rechazado | Cinemacenter',
//     loadComponent: () =>
//       import('./pages/pago-resultado/pago-resultado.component').then((m) => m.PagoResultadoComponent),
//     canActivate: [authGuard],
//     data: { estado: 'error' },
//   },
//   {
//     path: 'pago/pendiente',
//     title: 'Pago pendiente | Cinemacenter',
//     loadComponent: () =>
//       import('./pages/pago-resultado/pago-resultado.component').then((m) => m.PagoResultadoComponent),
//     canActivate: [authGuard],
//     data: { estado: 'pendiente' },
//   },
//   {
//     path: 'admin',
//     title: 'Panel de administración | Cinemacenter',
//     loadComponent: () => import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
//     canActivate: [authGuard, roleGuard('ADMINISTRADOR')],
//   },
//   {
//     path: 'admin/peliculas',
//     title: 'Gestión de películas | Cinemacenter',
//     loadComponent: () =>
//       import('./pages/peliculas/peliculas.component').then((m) => m.PeliculasComponent),
//     canActivate: [authGuard, roleGuard('ADMINISTRADOR')],
//   },
//   {
//     path: 'admin/funciones',
//     title: 'Gestión de funciones | Cinemacenter',
//     loadComponent: () =>
//       import('./pages/funciones/funciones.component').then((m) => m.FuncionesComponent),
//     canActivate: [authGuard, roleGuard('ADMINISTRADOR')],
//   },
//   {
//     path: 'admin/salas',
//     title: 'Gestión de salas | Cinemacenter',
//     loadComponent: () => import('./pages/salas/salas.component').then((m) => m.SalasComponent),
//     canActivate: [authGuard, roleGuard('ADMINISTRADOR')],
//   },
//   {
//     path: 'admin/usuarios',
//     title: 'Gestión de usuarios | Cinemacenter',
//     loadComponent: () => import('./pages/usuarios/usuarios.component').then((m) => m.UsuariosComponent),
//     canActivate: [authGuard, roleGuard('ADMINISTRADOR')],
//   },
//   {
//     path: 'admin/validar-ticket',
//     title: 'Validar ticket | Cinemacenter',
//     loadComponent: () =>
//       import('./pages/validar-ticket/validar-ticket.component').then((m) => m.ValidarTicketComponent),
//     canActivate: [authGuard, roleGuard('ADMINISTRADOR')],
//   },
//   {
//     path: 'admin/crear-admin',
//     title: 'Crear administrador | Cinemacenter',
//     loadComponent: () =>
//       import('./pages/crear-admin/crear-admin.component').then((m) => m.CrearAdminComponent),
//     canActivate: [authGuard, roleGuard('ADMINISTRADOR')],
//   },
//   {
//     path: 'admin/tema',
//     title: 'Personalizar tema | Cinemacenter',
//     loadComponent: () => import('./pages/tema/tema.component').then((m) => m.TemaComponent),
//     canActivate: [authGuard, roleGuard('ADMINISTRADOR')],
//   },
//   {
//     path: 'admin/estadisticas',
//     title: 'Estadísticas | Cinemacenter',
//     loadComponent: () =>
//       import('./pages/estadisticas/estadisticas.component').then((m) => m.EstadisticasComponent),
//     canActivate: [authGuard, roleGuard('ADMINISTRADOR')],
//   },
//   { path: '**', redirectTo: '' },
// ];
