# Checklist manual QA — CINE_MARCENTER_FRONT_2026

Casos difíciles de automatizar de forma fiable. Marcar al ejecutar.

## Funnel de compra

- [ ] F5 en `/butacas/:id` (horarios) — ¿mantiene ticket y lista funciones?
- [ ] F5 en `/butacas/:id/funcion/:fid` (asientos) — ¿se pierden holds/selección?
- [ ] F5 en `/butacas/.../pago` — ¿`compraPagoGuard` bloquea por pérdida de `CompraFlujoService`?
- [ ] Spam click en asientos (holds create/release) — ¿desync visual vs poll 2.5s?
- [ ] Dos pestañas misma función — carrera de holds / asiento bloqueado por el otro
- [ ] Máximo 20 asientos — toast/limite y no permite 21
- [ ] Salir de asientos sin ir a pago — ¿libera holds?
- [ ] Ir a pago y volver atrás — ¿preserva holds?
- [ ] Checkout efectivo/local → ticket; Mercado Pago → redirect
- [ ] Fallo de `crearPreferencia` tras reserva creada — ¿queda reserva huérfana en Mis reservas?

## Auth / sesión

- [ ] Token expirado mid-session (401) → logout + cartelera
- [ ] Login con `returnUrl` a butacas
- [ ] OAuth Google: ¿vuelve a `returnUrl` o siempre cartelera/admin?
- [ ] Registro: ¿sesión ya iniciada + redirect a login?
- [ ] Forgot/reset password end-to-end con backend

## Admin

- [ ] CRUD películas (fechas, imagen, duración 60–600)
- [ ] Funciones por rango (consistencia fechas/horas)
- [ ] Salas filas 1–20 / columnas 1–16
- [ ] Descuento PORCENTAJE > 100 — ¿lo acepta el form? (gap conocido)
- [ ] Crear admin solo SUPERADMIN
- [ ] Validar ticket `TK…` / case sensitivity
- [ ] Upload logo/fondo tema (tipos inválidos, tamaños grandes)
- [ ] Estadísticas con datos reales del backend

## UX / UI

- [ ] Responsive móvil: cartelera, seat-map, checkout, admin
- [ ] Navegación teclado en mapa de asientos
- [ ] Tema festivo / particles no bloquea clicks
- [ ] Offline / API caída mid-checkout — mensaje usable
- [ ] Splash/loading no se queda colgado
