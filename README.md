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

Cine Marcenter es una aplicación web para la experiencia de clientes y la operación administrativa de un cine. El cliente público puede explorar la cartelera y consultar películas. Los usuarios autenticados pueden continuar con la selección de asientos, gestionar sus reservas y acceder a las funciones de su cuenta. Los administradores disponen de un panel protegido para gestionar contenidos y consultar información operativa.

El frontend sigue una arquitectura de aplicación Angular basada en componentes standalone, rutas con carga diferida, servicios para comunicación HTTP, modelos TypeScript para los datos y guards para controlar el acceso de navegación según la sesión y el rol.

## Funcionalidades

### Experiencia del cliente

- Consulta de cartelera, estrenos y próximas películas.
- Visualización de la ficha y las funciones de una película.
- Registro, inicio de sesión y autenticación mediante el flujo OAuth2 implementado por la aplicación y el backend.
- Selección de función y butacas.
- Reserva de entradas, inicio del flujo de pago y páginas de resultado.
- Consulta de tickets y reservas propias.
- Visualización y edición de información de perfil.
- Páginas informativas y de contacto.

### Operación administrativa

- Panel de control con indicadores y gráficos.
- Gestión de películas: listado, creación, edición, eliminación y carga de imágenes.
- Gestión de salas y su capacidad.
- Gestión de funciones, incluyendo creación individual y generación por rango.
- Administración de usuarios: búsqueda, baja, reactivación y eliminación de administradores, según las operaciones provistas por la API.
- Creación de administradores.
- Validación de tickets.
- Consulta de estadísticas.
- Personalización visual del tema.

Las operaciones disponibles para cada módulo dependen de los endpoints expuestos por el backend. Por ejemplo, la API utilizada por este frontend ofrece alta, listado y baja de funciones; el cliente no implementa edición de funciones.

## Tecnologías

| Área | Tecnología |
|---|---|
| Framework | Angular 22 |
| Lenguaje | TypeScript |
| Interfaz y estilos | Angular Material/CDK, Bootstrap 5, CSS y SCSS |
| Formularios | Angular Reactive Forms en formularios de autenticación y gestión |
| Comunicación | Angular `HttpClient`, RxJS e interceptores HTTP |
| Visualización de datos | Chart.js y `ng2-charts` |
| Notificaciones | `ngx-toastr` |
| Pruebas unitarias | Vitest, mediante Angular CLI |
| Gestor de paquetes | npm |

Las versiones exactas de dependencias se encuentran en `package.json` y `package-lock.json`.

## Arquitectura

La aplicación separa las responsabilidades principales de la siguiente manera:

- **Páginas y componentes:** presentan la interfaz y coordinan las interacciones.
- **Servicios:** encapsulan las llamadas HTTP y la lógica transversal de autenticación, reservas, pagos y personalización.
- **Modelos:** describen los DTO y entidades intercambiados con la API.
- **Guards:** protegen rutas que requieren autenticación o un rol específico.
- **Interceptors:** adjuntan las credenciales de sesión a las solicitudes y centralizan el tratamiento de errores HTTP.
- **Pipes y utilidades:** reúnen transformaciones de presentación, manejo de fechas, JWT y errores de formularios.
- **Entornos:** contienen la dirección base de la API.

Las páginas se cargan de forma diferida desde `src/app/app.routes.ts`. La configuración de Angular y los proveedores HTTP se encuentran en `src/app/app.config.ts`.

### Autenticación y autorización

Los roles contemplados por el frontend son `CLIENTE` y `ADMINISTRADOR`. La aplicación conserva el token JWT en `sessionStorage`, aislando la sesión por pestaña, y deriva la información del rol de la respuesta de autenticación o de los claims del token.

`authGuard` limita el acceso a rutas que requieren una sesión vigente y `roleGuard` restringe las rutas administrativas a `ADMINISTRADOR`. Estos controles mejoran la navegación de la interfaz, pero **no sustituyen la autorización del servidor**: el backend debe validar el token, el rol y los permisos en cada endpoint protegido.

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

Configuración predeterminada:

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

La configuración se define actualmente en `src/environments/environment.ts`:

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  baseUrl: 'http://localhost:8080',
};
```

- `apiUrl` es el prefijo utilizado por los servicios, por ejemplo `http://localhost:8080/api/peliculas`.
- `baseUrl` se utiliza cuando una integración necesita la raíz del servidor.

Para desarrollo local, reemplazá host y puerto por los que correspondan a tu backend. Para desplegar en otro entorno, configurá la URL del servidor apropiada antes de compilar y revisá que el backend permita el origen del frontend mediante CORS.

> **Importante:** este proyecto no cuenta actualmente con una estrategia de reemplazo de archivos de entorno declarada en `angular.json`. Por eso, no asumas que una compilación de producción cambia automáticamente la URL local configurada: verificá la configuración efectiva antes de publicar.

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

El resultado del navegador se genera en `dist/CINE_MARCENTER_FRONT_2026/browser/`. La configuración de producción está definida en `angular.json`; antes de desplegar, configurá y validá la URL de API del entorno destino.

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
| `npx ng generate component nombre` | Genera un componente Angular con Angular CLI. |

Ejecutar pruebas:

```bash
npm test
```

El repositorio también define un workflow de GitHub Actions en `.github/workflows/build.yml`. En push y pull request hacia las ramas configuradas, instala dependencias con `npm ci --legacy-peer-deps` y ejecuta `npm run build`.

## Rutas principales

| Ruta | Acceso | Propósito |
|---|---|---|
| `/cartelera` | Público | Cartelera y consulta de películas. |
| `/pelicula/:id` | Público | Detalle de una película. |
| `/login` | Público | Inicio de sesión. |
| `/registro` | Público | Registro de clientes. |
| `/contacto` | Público | Información de contacto. |
| `/butacas/:id` | Sesión requerida | Selección de asientos para una función. |
| `/mis-reservas` | Sesión requerida | Reservas del usuario. |
| `/perfil` | Sesión requerida | Perfil de usuario. |
| `/ticket/:numero` | Sesión requerida | Consulta del ticket. |
| `/admin` | Solo administrador | Panel de administración. |
| `/admin/peliculas` | Solo administrador | Gestión de películas. |
| `/admin/funciones` | Solo administrador | Gestión de funciones. |
| `/admin/salas` | Solo administrador | Gestión de salas. |
| `/admin/usuarios` | Solo administrador | Administración de usuarios. |
| `/admin/estadisticas` | Solo administrador | Indicadores y estadísticas. |
| `/admin/validar-ticket` | Solo administrador | Validación de tickets. |
| `/admin/crear-admin` | Solo administrador | Alta de administradores. |
| `/admin/tema` | Solo administrador | Personalización visual. |

Las rutas adicionales, estados de pago y condiciones de acceso se mantienen en `src/app/app.routes.ts`.

## Integración con el backend

La comunicación se realiza con `HttpClient`; no se utiliza `json-server`. Entre los servicios principales se encuentran:

| Servicio | Responsabilidad |
|---|---|
| `AuthService` | Inicio de sesión, registro, estado de sesión y rol. |
| `PeliculaService` | Consulta y operaciones CRUD de películas, incluida la carga de póster. |
| `SalaService` | Consulta y operaciones CRUD de salas y sus asientos. |
| `FuncionService` | Consulta, creación individual o por rango y eliminación de funciones. |
| `ReservaService` | Reservas, consulta de tickets, cancelación y validación. |
| `HoldService` | Operaciones de retención temporal de asientos. |
| `PaymentService` | Creación de preferencia de pago. |
| `EstadisticasService` | Indicadores y estadísticas para administración. |
| `UsuarioService` | Consulta y administración de usuarios. |
| `CustomizacionService` | Lectura y persistencia de personalización visual. |

Los servicios se encuentran en `src/app/services/`. Las rutas y contratos concretos deben mantenerse alineados con la versión del backend utilizada. Los endpoints administrativos requieren que el backend realice sus propias verificaciones de autenticación y autorización.

## Estructura del proyecto

```text
src/
├── app/
│   ├── components/       # Componentes reutilizables de interfaz
│   ├── guards/           # Guards de autenticación, rol y acceso a butacas
│   ├── interceptors/     # Interceptores de autenticación y errores
│   ├── models/           # Tipos y modelos de datos
│   ├── pages/            # Páginas organizadas por funcionalidad
│   ├── pipes/            # Formateo y presentación de datos
│   ├── services/         # Servicios de aplicación e integración HTTP
│   ├── utils/            # Funciones auxiliares y utilidades
│   ├── app.config.ts     # Proveedores y configuración de la aplicación
│   └── app.routes.ts     # Definición de rutas
├── assets/               # Imágenes y otros recursos estáticos
├── environments/         # Configuración de API y entorno
├── index.html
├── main.ts               # Punto de entrada del navegador
└── styles.css            # Estilos globales
```

Otros archivos relevantes:

- `angular.json`: configuración de build, desarrollo, estilos y presupuestos.
- `package.json`: dependencias y scripts.
- `package-lock.json`: versiones reproducibles de dependencias.
- `tsconfig*.json`: configuración de TypeScript.
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

Verificá que el usuario exista en el backend, que el login devuelva un JWT válido y que el token contenga el rol esperado (`CLIENTE` o `ADMINISTRADOR`). Los guards del frontend no otorgan permisos en el servidor.

### Fallo al instalar dependencias

Verificá Node.js y npm con `node --version` y `npm --version`, y luego ejecutá desde la raíz del repositorio:

```bash
npm ci --legacy-peer-deps
```

### Problemas de compilación

Ejecutá `npm run build` y revisá el primer error reportado por Angular o TypeScript. Las advertencias de presupuesto se configuran en `angular.json`; no deben ignorarse sin evaluar el impacto del bundle.

## Estado y limitaciones conocidas

- El backend es un proyecto independiente y no se incluye aquí.
- La URL configurada por defecto es local (`http://localhost:8080/api`); debe adaptarse al entorno de ejecución.
- Las funciones no cuentan con operación de edición en la API utilizada por este frontend.
- La protección del cliente debe complementarse con autorización en el servidor.
- La compilación de producción aplica un presupuesto de tamaño al bundle inicial, definido en `angular.json`.

## Equipo y contexto académico

Este proyecto se desarrolla en el marco de **Programación IV — 2026** y se integra con el backend del proyecto académico correspondiente. Para la versión de entrega, completar esta sección con los datos validados por el grupo y la cátedra:

- **Institución y carrera:** completar según la denominación oficial.
- **Comisión / docente:** completar según corresponda.
- **Integrantes:** nombres y apellidos de todos los integrantes.
- **Repositorio del backend:** agregar el enlace si es público y corresponde compartirlo.

---

Proyecto académico. La ejecución funcional de los flujos que dependen de datos requiere una API compatible y accesible.
