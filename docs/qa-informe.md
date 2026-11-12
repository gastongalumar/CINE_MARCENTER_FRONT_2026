# Informe QA — CINE_MARCENTER_FRONT_2026

## Resumen ejecutivo

Se armó una suite QA completa del frontend (Vitest unitarios + Playwright e2e + checklist manual). **No se corrigieron bugs de producto** en esta pasada: varios gaps quedaron documentados y/o assertados por tests.

**Estado de corridas:** unitarios 257/257 OK; e2e 15/15 OK.

## Resultados de corridas

| Suite | Pass | Fail | Skip | Fecha |
|-------|------|------|------|-------|
| `ng test --watch=false` | 257 | 0 | 0 | 2026-11-11 |
| `npx playwright test` | 15 | 0 | 0 | 2026-11-11 |

Comandos:

```bash
npm run test:ci
npm run e2e
```

## Fallas / gaps encontrados (S1–S4)

| ID | Severidad | Área | Descripción | Evidencia |
|----|-----------|------|-------------|-----------|
| F01 | **S1** | Compra / pago | `CompraFlujoService` es solo memoria: F5 (o nueva carga) en `/pago` pierde la selección y `compraPagoGuard` bloquea, aunque los holds puedan seguir vivos en backend. | Análisis + checklist; `compra-flujo.service` / `compra-pago` |
| F02 | **S1** | Pago MP | Si `crearPreferencia` falla después de `crearReserva` exitosa, el flujo ya hizo `clear()` y no hay rollback UI; puede quedar reserva sin preferencia de pago. | `compra-checkout.spec.ts` |
| F03 | **S2** | OAuth | `OAuth2RedirectComponent` ignora `returnUrl`: cliente siempre a `/cartelera`, staff a `/admin`. Se pierde intención de compra post-Google. | `oauth2-redirect.spec.ts`, e2e oauth |
| F04 | **S2** | Pago resultado | Sin `external_reference`/`reservaId` en la URL, usa `reservas[0]` (puede mostrar otra reserva). | `pago-resultado.spec.ts` |
| F05 | **S2** | Auth endpoints | `isPublicAuthEndpoint` solo contempla login/registro; forgot/reset no son “públicos” → un 401 ahí puede disparar logout+redirect del interceptor. | `auth-endpoints.spec.ts` |
| F06 | **S3** | Descuentos admin | Form PORCENTAJE **no** tiene `Validators.max(100)`; acepta valor `150`. | `admin-descuento-form.spec.ts` |
| F07 | **S3** | JWT / roles | `parseTipoUsuario` ante tipo desconocido/null defaulta a `CLIENTE` (puede enmascarar claims corruptos). | `auth.spec.ts` (model) |
| F08 | **S3** | Compra guards | `compraPagoGuard` no valida `peliculaId`; con `funcionId` NaN redirige con `NaN` en la URL. | `compra-pago.spec.ts` |
| F09 | **S3** | Compra estado | `clear()` no limpia `peliculaId` (estado parcial). | `compra-flujo.service.spec.ts` |
| F10 | **S4** | Validar ticket | Patrón `/^TK\d+$/` case-sensitive: `tk99` inválido antes de uppercasing. | `validar-ticket.spec.ts` |

Severidad: **S1** bloquea dinero/sesión crítica; **S2** UX/seguridad relevante; **S3** integridad/datos; **S4** polish.

## Prioridad de fixes recomendados

1. Persistir selección de compra (sessionStorage) o rehidratar desde holds — **F01**.
2. Rollback / UX de recuperación si falla preferencia MP — **F02**.
3. Propagar `returnUrl` en OAuth — **F03**.
4. Exigir `external_reference` en pago-resultado (sin fallback ciego) — **F04**.
5. Ampliar `isPublicAuthEndpoint` — **F05**.
6. `Validators.max(100)` en descuento % — **F06**.
7. Resto S3/S4 según capacidad.

## Cobertura vs gaps

### Cubierto

- **Auth spine:** JWT, AuthService, auth/role guards, interceptors auth/error, api-error, auth-endpoints.
- **Compra:** CompraFlujo, holds, payment, reserva, seat-map, asientos/checkout (métodos clave), pago-resultado, oauth2-redirect, guards butacas/funcion/pago.
- **Dominio HTTP:** pelicula, funcion, sala, usuario, candy, descuentos, estadisticas, customizacion, image, loading, confirm-dialog.
- **Forms:** login, registro, olvidar/reset, perfil, crear-admin, salas, descuento (gap %), validar-ticket, header logout/roles.
- **E2E (API mockeada):** auth, funnel compra, deep-link, admin bloqueado en pago, OAuth, pago/exito, mis-reservas, admin smoke, crear-admin roles, estadísticas.

### Gaps restantes (no automatizados o parciales)

- Flujos visuales con partículas/tema; uploads reales de imagen.
- Carreras multi-pestaña / F5 (checklist manual).
- Integración real contra backend Java (e2e usa mocks).
- Cobertura % formal / gates CI (recomendado: agregar en pipeline `test:ci` + `e2e`).
- Algunos listados admin y páginas contacto son solo smoke vía e2e admin o sin spec dedicado.

## Artefactos

| Ruta | Rol |
|------|-----|
| `src/testing/` | Helpers JWT, Auth mock, Router/Toastr, HTTP testing |
| `e2e/` | Specs Playwright + helpers API mock |
| `docs/qa-checklist.md` | Casos manuales |
| `playwright.config.ts` | Runner e2e + webServer `ng serve` |
