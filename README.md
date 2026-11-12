# Cine Marcenter

**Aplicación web de gestión y venta de entradas para una cadena de cines**

Frontend desarrollado con **Angular 22** como proyecto académico de Programación IV.

La aplicación permite consultar la cartelera, seleccionar funciones y butacas, gestionar reservas y pagos, y administrar los datos operativos del cine. Se integra mediante HTTP con una API REST externa; el backend no forma parte de este repositorio y debe ejecutarse por separado.

> **Alcance de este repositorio:** cliente web Angular. Los datos, las reglas de negocio definitivas, la autenticación y la autorización de las operaciones protegidas dependen del backend configurado.

---

## Contenido

- [Descripción](#descripción)
- [Funcionalidades](#funcionalidades)
- [Tecnologías](#tecnologías)
- [Arquitectura](#arquitectura)
- [Requisitos previos](#requisitos-previos)
- [Puesta en marcha](#puesta-en-marcha)
- [Configuración de la API](#configuración-de-la-api)
- [Ejecución](#ejecución)
- [Compilación y pruebas](#compilación-y-pruebas)
- [Rutas principales](#rutas-principales)
- [Integración con el backend](#integración-con-el-backend)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Resolución de problemas](#resolución-de-problemas)
- [Estado y limitaciones conocidas](#estado-y-limitaciones-conocidas)

## Descripción

Cine Marcenter es una aplicación web para la experiencia de clientes y la operación administrativa de un cine. El cliente público puede explorar la cartelera, consultar películas y ver horarios. Los usuarios autenticados pueden continuar con la selección de asientos, agregar combos o códigos de descuento, gestionar sus reservas y acceder a las funciones de su cuenta. Los administradores disponen de un panel protegido para gestionar contenidos, candy, descuentos, validación de tickets, estadísticas y la personalización visual (incluido un efecto festivo global).

El frontend sigue una arquitectura Angular basada en componentes standalone, rutas con carga diferida (`loadComponent`), change detection zoneless, servicios para comunicación HTTP y orquestación de flujos, modelos TypeScript, guards de autenticación/rol/flujo de compra e interceptores HTTP.

## Funcionalidades

### Experiencia del cliente

- Consulta de cartelera, estrenos y próximas películas.
- Visualización de la ficha y las funciones de una película.
- Registro, inicio de sesión, recuperación de contraseña y autenticación OAuth2 (Google) con el backend.
- Flujo de compra en tres pasos: horarios (público) → asientos (con retención temporal / holds) → checkout.
- Combos de candy y códigos de descuento en el checkout.
- Reserva de entradas, Mercado Pago y páginas de resultado (`exito` / `error` / `pendiente`).
- Consulta de tickets y reservas propias.
- Visualización y edición de información de perfil.
- Páginas informativas de contacto, cumpleaños, candy y promociones.
- Splash/loading global (overlay, no es una ruta) alineado al tema del cine.

### Operación administrativa

- Panel de control con indicadores y gráficos.
- Gestión de películas: listado, creación, edición, eliminación y carga de imágenes.
- Gestión de salas y su capacidad.
- Gestión de funciones, incluyendo creación individual y generación por rango.
- Administración de combos candy y códigos de descuento.
- Administración de usuarios: búsqueda, baja, reactivación y operaciones sobre administradores, según la API.
- Creación de administradores (**solo SUPERADMIN**).
- Validación de tickets en puerta.
- Consulta de estadísticas.
- Personalización visual del tema (colores, tipografías, logo, fondo imagen/video, nombre del cine) y **efectos festivos** (navidad, halloween, año nuevo).

Las operaciones disponibles para cada módulo dependen de los endpoints expuestos por el backend. Por ejemplo, la API utilizada por este frontend ofrece alta, listado y baja de funciones; el cliente no implementa edición de funciones.

## Tecnologías

| Área | Tecnología |
|---|---|
| Framework | Angular 22 (standalone, zoneless) |
| Lenguaje | TypeScript |
| Interfaz y estilos | Angular Material/CDK, Bootstrap 5, CSS y SCSS |
| Formularios | Angular Reactive Forms en autenticación y gestión |
| Comunicación | Angular `HttpClient`, RxJS e interceptores HTTP |
| Visualización de datos | Chart.js y `ng2-charts` |
| Notificaciones | `ngx-toastr` |
| Efectos visuales | `@tsparticles/engine`, `slim`, `plugin-emitters`, `updater-wobble` |
| Pruebas unitarias | Vitest, mediante Angular CLI |
| Pruebas e2e | Playwright |
| Gestor de paquetes | npm |

Las versiones exactas de dependencias se encuentran en `package.json` y `package-lock.json`.

## Arquitectura

La aplicación separa las responsabilidades principales de la siguiente manera:

- **Páginas y componentes:** presentan la interfaz y coordinan las interacciones.
- **Servicios:** encapsulan las llamadas HTTP y la lógica transversal (autenticación, reservas, holds, pagos, compra, personalización).
- **Modelos:** describen los DTO y entidades intercambiados con la API.
- **Guards:** protegen rutas por sesión, rol, invitado, token de reset, ownership de ticket y continuidad del flujo de compra (`auth`, `guest`, `role`, `resetToken`, `ticketOwner`, `butacasAccess`, `funcionAccess`, `compraPago`).
- **Interceptors:** adjuntan el Bearer JWT y centralizan el tratamiento de errores HTTP (con opción de omitir toast por `HttpContext`).
- **Effects:** presets de partículas para efectos festivos (`src/app/effects/`).
- **Pipes y utilidades:** transformaciones de presentación, fechas, JWT, tickets de navegación a butacas y errores de formularios.
- **Entornos:** contienen la dirección base de la API (`environment.ts` / `environment.prod.ts`).

Las páginas se cargan de forma diferida desde `src/app/app.routes.ts`. La configuración de Angular y los proveedores HTTP se encuentran en `src/app/app.config.ts`.

### Autenticación y autorización

Los roles contemplados por el frontend son `CLIENTE`, `ADMINISTRADOR` y `SUPERADMIN`.

- `ADMINISTRADOR` y `SUPERADMIN` acceden al panel (`/admin/**`).
- Solo `SUPERADMIN` puede usar `/admin/crear-admin`.
- El helper `esStaff` agrupa ambos roles de personal.

La aplicación conserva el token JWT en `sessionStorage` (clave `access_token`), aislando la sesión por pestaña, y deriva el rol de la respuesta de autenticación o de los claims del token. El estado de sesión se expone con **signals** en `AuthService`.

`authGuard` limita el acceso a rutas con sesión vigente, `guestGuard` restringe login/registro/recuperación a usuarios sin sesión, `resetTokenGuard` valida el token de reset de contraseña y `roleGuard` restringe rutas por rol. Los guards del flujo de compra (`butacasAccessGuard`, `funcionAccessGuard`, `compraPagoGuard`) evitan deep-links incompletos y bloquean la compra al personal; `ticketOwnerGuard` limita la vista del ticket. Estos controles mejoran la navegación de la interfaz, pero **no sustituyen la autorización del servidor**: el backend debe validar el token, el rol y los permisos en cada endpoint protegido.

### Flujo de compra (resumen)

```text
/butacas/:peliculaId
  → /butacas/:peliculaId/funcion/:funcionId
  → /butacas/:peliculaId/funcion/:funcionId/pago
```

El primer paso (horarios) es público; asientos y checkout requieren autenticación. Estado compartido en memoria: `CompraFlujoService` (máx. 20 entradas). Concurrencia de asientos mediante `HoldService` y polling del estado de la función. El mapa de butacas vive en el componente `seat-map`, usado por `pages/compra/compra-asientos`. Checkout opcional con candy y descuentos; pago con Mercado Pago o emisión directa de ticket.

### Personalización y efectos festivos

`CustomizacionService` carga y guarda el tema (`/customizacion`), aplica variables CSS, fondo imagen o video, y un efecto festivo opcional. El efecto combina:

1. Atributo `data-efecto` en `<html>` + CSS (`src/styles/efectos-festivos.css`)
2. Overlay DOM (atmósfera y props)
3. Canvas tsparticles (presets en `src/app/effects/efecto-festivo.presets.ts`)

La UI de administración está en `/admin/tema` (preview local hasta guardar).

## Requisitos previos

1. **Node.js:** una versión admitida por el proyecto: `^22.22.3`, `^24.15.0` o `>=26.0.0`, según `package.json`.
2. **npm:** se recomienda npm `11.6.2`, indicado en el campo `packageManager`.
3. **Git:** para clonar el repositorio.
4. **Backend:** la API compatible debe estar iniciada y accesible desde el navegador. La configuración actual apunta a `http://localhost:8080/api`.
5. **Navegador moderno** con JavaScript habilitado.

Se recomienda usar una versión LTS compatible de Node.js y mantener la versión de npm del proyecto. Si se utiliza `fnm`, la versión indicada por `engines.node` puede instalarse desde la raíz:

```bash
fnm install
fnm use
node --version
npm --version
```

## Puesta en marcha

### 1. Clonar el repositorio

```bash
git clone https://github.com/gastongalumar/CINE_MARCENTER_FRONT_2026.git
cd CINE_MARCENTER_FRONT_2026
```

### 2. Instalar dependencias

```bash
npm ci --legacy-peer-deps
```

`npm ci` instala las versiones fijadas en `package-lock.json`. La opción `--legacy-peer-deps` también se utiliza en el flujo de integración continua del repositorio para resolver las dependencias entre paquetes.

### 3. Iniciar y verificar el backend

Iniciá por separado el backend compatible con la API y verificá que responda en la dirección configurada. La aplicación no incluye un servidor simulado ni datos de prueba locales.

Configuración predeterminada (desarrollo):

```text
API REST: http://localhost:8080/api
Servidor base: http://localhost:8080
```

Si el backend utiliza otro host, puerto o prefijo, actualizá el entorno antes de iniciar el frontend (ver [Configuración de la API](#configuración-de-la-api)).

### 4. Iniciar el frontend

```bash
npm start
```

Abrí [http://localhost:4200](http://localhost:4200) en el navegador. Angular recompila la aplicación y actualiza la página al detectar cambios en los archivos fuente.

## Configuración de la API

La configuración de desarrollo se define en `src/environments/environment.ts`:

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  baseUrl: 'http://localhost:8080',
};
```

En producción, `angular.json` aplica `fileReplacements` y sustituye ese archivo por `src/environments/environment.prod.ts`:

```ts
export const environment = {
  production: true,
  apiUrl: '/api',
  baseUrl: '',
};
```

Con esa configuración, el frontend y la API se esperan en el mismo origen (por ejemplo, Nginx como proxy hacia el backend).

- `apiUrl` es el prefijo utilizado por los servicios, por ejemplo `http://localhost:8080/api/peliculas` en desarrollo o `/api/peliculas` en producción.
- `baseUrl` se utiliza cuando una integración necesita la raíz del servidor (por ejemplo OAuth2 Google).

Para desarrollo local, reemplazá host y puerto por los que correspondan a tu backend. Para otro despliegue, ajustá `environment.prod.ts` (o el entorno efectivo) antes de compilar y revisá que el backend permita el origen del frontend mediante CORS cuando no compartan origen.

No incluyas credenciales, secretos, tokens ni claves privadas en el código del frontend. Todo valor distribuido en una aplicación web puede ser inspeccionado por sus usuarios.

## Ejecución

### Servidor de desarrollo

```bash
npm start
```

Equivalente con Angular CLI:

```bash
npx ng serve
```

Opciones habituales:

```bash
npx ng serve --host 0.0.0.0 --port 4200
```

Al exponer el servidor en la red local, hacelo únicamente en una red de confianza y considerá las reglas de firewall del equipo.

### Compilación de producción

```bash
npm run build
```

El resultado del navegador se genera en `dist/CINE_MARCENTER_FRONT_2026/browser/`. La configuración de producción está definida en `angular.json` e incluye el reemplazo de entornos; antes de desplegar, validá la URL de API del entorno destino.

### Compilación de desarrollo

```bash
npm run watch
```

Este comando compila en modo de desarrollo y vuelve a compilar al detectar cambios.

## Compilación y pruebas

Los scripts disponibles se definen en `package.json`:

| Comando | Propósito |
|---|---|
| `npm start` | Inicia el servidor de desarrollo Angular. |
| `npm run build` | Genera el bundle de producción. |
| `npm run watch` | Compila en desarrollo y observa cambios. |
| `npm test` | Ejecuta las pruebas unitarias mediante Angular CLI/Vitest. |
| `npm run test:ci` | Ejecuta las pruebas unitarias una sola vez (`--watch=false`). |
| `npm run e2e` | Ejecuta las pruebas end-to-end con Playwright. |
| `npm run e2e:ui` | Abre la interfaz interactiva de Playwright. |
| `npx ng generate component nombre` | Genera un componente Angular con Angular CLI. |

Ejecutar pruebas:

```bash
npm test
npm run test:ci
npm run e2e
```

El repositorio también define un workflow de GitHub Actions en `.github/workflows/build.yml`. En push y pull request hacia las ramas `main`, `master` y `DEV`, instala dependencias con `npm ci --legacy-peer-deps` y ejecuta `npm run build`.

## Rutas principales

### Públicas

| Ruta | Acceso | Propósito |
|---|---|---|
| `/cartelera` | Público | Cartelera y consulta de películas. |
| `/pelicula/:id` | Público | Detalle de una película. |
| `/butacas/:peliculaId` | Público + `butacasAccessGuard` | Selección de horario. |
| `/login` | Solo sin sesión (`guestGuard`) | Inicio de sesión. |
| `/registro` | Solo sin sesión (`guestGuard`) | Registro de clientes. |
| `/olvidar-password` | Solo sin sesión (`guestGuard`) | Solicitud de recuperación de contraseña. |
| `/reset-password` | Token de reset (`resetTokenGuard`) | Definir nueva contraseña. |
| `/oauth2/redirect` | Público | Handoff del JWT tras login con Google. |
| `/contacto` | Público | Información de contacto. |
| `/contacto/cumpleanos` | Público | Cumpleaños. |
| `/contacto/candy` | Público | Candy bar informativo. |
| `/contacto/promos` | Público | Promociones. |

### Cliente autenticado

| Ruta | Acceso | Propósito |
|---|---|---|
| `/butacas/:peliculaId/funcion/:funcionId` | Sesión + tickets de flujo | Selección de asientos (holds). |
| `/butacas/:peliculaId/funcion/:funcionId/pago` | `CLIENTE` + tickets + `compraPagoGuard` | Checkout (candy, descuento, pago). |
| `/mis-reservas` | `CLIENTE` | Reservas del usuario. |
| `/perfil` | Sesión requerida | Perfil de usuario. |
| `/ticket/:numero` | `CLIENTE` + `ticketOwnerGuard` | Consulta del ticket. |
| `/pago/exito` | `CLIENTE` | Resultado de pago exitoso. |
| `/pago/error` | `CLIENTE` | Resultado de pago rechazado. |
| `/pago/pendiente` | `CLIENTE` | Resultado de pago pendiente. |

### Administración

| Ruta | Acceso | Propósito |
|---|---|---|
| `/admin` | ADMINISTRADOR o SUPERADMIN | Panel de administración. |
| `/admin/peliculas` | Staff | Gestión de películas. |
| `/admin/peliculas/listado` | Staff | Listado de películas. |
| `/admin/funciones` | Staff | Gestión de funciones. |
| `/admin/funciones/listado` | Staff | Listado de funciones. |
| `/admin/salas` | Staff | Gestión de salas. |
| `/admin/salas/listado` | Staff | Listado de salas. |
| `/admin/candy` | Staff | Combos candy. |
| `/admin/candy/nuevo` | Staff | Alta de combo. |
| `/admin/candy/:id` | Staff | Edición de combo. |
| `/admin/descuentos` | Staff | Códigos de descuento. |
| `/admin/descuentos/nuevo` | Staff | Alta de código. |
| `/admin/descuentos/:id` | Staff | Edición de código. |
| `/admin/usuarios` | Staff | Administración de usuarios. |
| `/admin/estadisticas` | Staff | Indicadores y estadísticas. |
| `/admin/validar-ticket` | Staff | Validación de tickets. |
| `/admin/tema` | Staff | Personalización visual y efectos festivos. |
| `/admin/crear-admin` | Solo SUPERADMIN | Alta de administradores. |

Las condiciones de acceso completas se mantienen en `src/app/app.routes.ts`.

## Integración con el backend

La comunicación se realiza con `HttpClient`; no se utiliza `json-server`. Entre los servicios principales se encuentran:

| Servicio | Responsabilidad |
|---|---|
| `AuthService` | Login, registro, sesión, roles, OAuth helpers y alta de admin. |
| `PeliculaService` | Consulta y operaciones CRUD de películas, incluida la carga de póster. |
| `SalaService` | Consulta y operaciones CRUD de salas y sus asientos. |
| `FuncionService` | Consulta, creación individual o por rango, baja y estado de asientos. |
| `ReservaService` | Reservas, consulta de tickets, cancelación y validación. |
| `HoldService` | Retención temporal de asientos (crear / liberar). |
| `CompraFlujoService` | Estado in-memory del funnel horarios → asientos → pago. |
| `PaymentService` | Creación de preferencia de pago (Mercado Pago). |
| `CandyComboService` | Combos candy (consulta y administración). |
| `CodigoDescuentoService` | Códigos de descuento (CRUD y validación en checkout). |
| `EstadisticasService` | Indicadores y estadísticas para administración. |
| `UsuarioService` | Consulta y administración de usuarios / perfil. |
| `CustomizacionService` | Tema visual, fondo y efectos festivos. |
| `ImageService` | Resolución / manejo de URLs de imagen. |
| `LoadingService` | Contador del splash/loading global. |
| `ConfirmDialogService` | Diálogos de confirmación (Material). |

Los servicios se encuentran en `src/app/services/`. Las rutas y contratos concretos deben mantenerse alineados con la versión del backend utilizada. Los endpoints administrativos requieren que el backend realice sus propias verificaciones de autenticación y autorización.

## Estructura del proyecto

```text
src/
├── app/
│   ├── components/       # Header, footer, listados, pickers, etc.
│   ├── effects/          # Presets tsparticles de efectos festivos
│   ├── guards/           # Auth, guest, rol, reset, ticket y flujo de compra
│   ├── interceptors/     # Bearer JWT y errores HTTP
│   ├── models/           # Tipos y modelos de datos
│   ├── pages/            # Páginas por funcionalidad (incl. compra/ y seat-map)
│   ├── pipes/            # Formateo y presentación
│   ├── services/         # HTTP y orquestación
│   ├── utils/            # JWT, butacas-access, errores, fechas…
│   ├── app.config.ts     # Proveedores y configuración
│   └── app.routes.ts     # Definición de rutas lazy
├── assets/               # Recursos estáticos
├── environments/         # apiUrl / baseUrl (dev y prod)
├── styles/               # Estilos compartidos (p. ej. efectos-festivos.css)
├── index.html
├── main.ts
└── styles.css            # Estilos globales y variables de tema
```

Otros archivos relevantes:

- `angular.json`: configuración de build, desarrollo, estilos, presupuestos y `fileReplacements`.
- `package.json`: dependencias y scripts.
- `package-lock.json`: versiones reproducibles de dependencias.
- `tsconfig*.json`: configuración de TypeScript.
- `playwright.config.ts`: configuración de pruebas e2e.
- `.github/workflows/build.yml`: compilación automatizada en GitHub Actions.

## Resolución de problemas

### La aplicación abre, pero no carga información

1. Confirmá que el backend esté iniciado.
2. Verificá `apiUrl` en `src/environments/environment.ts`.
3. Revisá la consola del navegador y la pestaña **Network** para identificar errores HTTP.
4. Comprobá que el backend permita el origen `http://localhost:4200` mediante CORS.

### Error CORS

La política CORS debe configurarse en el backend para permitir el origen del frontend y los métodos/cabeceras requeridos. No se resuelve habilitando CORS en el código de la interfaz.

### Error de autenticación o rutas administrativas inaccesibles

Verificá que el usuario exista en el backend, que el login devuelva un JWT válido y que el token contenga el rol esperado (`CLIENTE`, `ADMINISTRADOR` o `SUPERADMIN`). Los guards del frontend no otorgan permisos en el servidor. Para crear administradores se requiere un usuario `SUPERADMIN`.

### No puedo entrar directo a `/butacas/...`

El flujo de compra usa tickets de navegación en `sessionStorage`. Hay que llegar desde cartelera/ficha (o un `returnUrl` de login válido). Pegar la URL no basta: los pasos de asientos y pago también exigen sesión (y rol `CLIENTE` en el checkout).

### Fallo al instalar dependencias

Verificá Node.js y npm con `node --version` y `npm --version`, y luego ejecutá desde la raíz del repositorio:

```bash
npm ci --legacy-peer-deps
```

### Problemas de compilación

Ejecutá `npm run build` y revisá el primer error reportado por Angular o TypeScript. Las advertencias de presupuesto se configuran en `angular.json`; no deben ignorarse sin evaluar el impacto del bundle.

## Estado y limitaciones conocidas

- El backend es un proyecto independiente y no se incluye aquí.
- En desarrollo la URL por defecto es `http://localhost:8080/api`; en producción el build usa `/api` vía `environment.prod.ts`.
- Las funciones no cuentan con operación de edición en la API utilizada por este frontend.
- La protección del cliente (guards) debe complementarse con autorización en el servidor.
- La concurrencia de butacas depende de holds y del estado expuesto por la API; el polling del mapa es UX, no fuente de verdad.
- Los efectos festivos dependen de que la customización esté persistida y servida por `/customizacion`.
- El flujo de compra productivo es `pages/compra/*`; el mapa de asientos (`pages/seat-map`) es un componente reutilizado por ese flujo, no una ruta independiente.
- La compilación de producción aplica un presupuesto de tamaño al bundle inicial, definido en `angular.json`.

## Contexto académico

Proyecto académico de **Programación IV — 2026**. La ejecución funcional de los flujos que dependen de datos requiere una API compatible y accesible.
