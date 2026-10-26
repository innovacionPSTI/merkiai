# Merkiai — Guía de Setup

> Puesta en marcha del monorepo (local y producción): requisitos, instalación, variables de entorno por app, base de datos y migraciones, monitoreo de errores (Sentry) y verificación.
> Complementa a `README.md` (visión y arquitectura), `DEPLOYMENT.md` (despliegue detallado) y `STACK_AUTH_SETUP.md` (identidad).

---

## 1. Requisitos previos

| Herramienta | Versión | Notas |
|-------------|---------|-------|
| Node.js | ≥ 20 (probado en 22) | |
| pnpm | 9.x | Gestor del monorepo (`corepack enable` lo provee) |
| Supabase CLI | reciente | Migraciones y generación de tipos |
| Cuenta Supabase | — | **Dos** proyectos: *plano de tienda* y *plano de plataforma* |
| Cuenta Stack Auth | — | **Tres** proyectos: web / admin / console |
| Cuenta Sentry | opcional | Monitoreo de errores (HU-170) |

---

## 2. Estructura del monorepo

```
apps/
  web/        Storefront público (Next.js 16)       ← Sentry vive aquí
  admin/      Panel de tienda (Next.js 16)
  console/    Control plane / consola del operador SaaS
packages/
  database/   Cliente Supabase, queries, tipos, RPC y migraciones
  tenancy/    Entitlements, planes, resolución de tenant
  ui/         Design system compartido
  config/     Config compartida (tsconfig, etc.)
```

- **Plano de TIENDA** (Supabase): catálogo, pedidos, clientes, CMS, gift cards, etc. Lo comparten `web` + `admin`.
- **Plano de PLATAFORMA** (Supabase): tenants, planes, dominios. Solo lo usa `console`.

---

## 3. Instalación local

```bash
corepack enable            # habilita pnpm 9
pnpm install               # instala todo el workspace (incluye @sentry/nextjs en web)
```

Copia los `.env.example` de cada app a `.env.local` y complétalos (ver §5):

```bash
cp apps/web/.env.example     apps/web/.env.local
cp apps/admin/.env.example   apps/admin/.env.local
cp apps/console/.env.example apps/console/.env.local
```

Levanta en desarrollo (todas las apps vía Turborepo):

```bash
pnpm dev
```

o una sola app:

```bash
pnpm --filter @merkiai/web dev
pnpm --filter @merkiai/admin dev
pnpm --filter @merkiai/console dev
```

---

## 4. Base de datos y migraciones

Las migraciones del plano de tienda están en `packages/database/supabase/migrations/e17/` y son **idempotentes** (se pueden re-aplicar). Se aplican **en orden** (`01_…` → `53_…`).

### Aplicar

Con Supabase CLI (apuntando al proyecto de tienda):

```bash
supabase db push
```

o manualmente, ejecutando cada `.sql` en el SQL editor del proyecto **de tienda** en orden.

### Regenerar tipos TypeScript

```bash
pnpm db:generate:remote   # usa SUPABASE_PROJECT_REF
# o, con Supabase local:
pnpm db:generate
```

### Migraciones recientes (referencia rápida)

| Migración | HU | Qué crea |
|-----------|----|----------|
| `41_redirects` | HU-113 | Redirects 301/302 por tienda |
| `42_vip_club` + `43_…notifications` | HU-288…292 | Segmentos y campañas VIP |
| `44_promotions` | HU-147 | Motor de promociones |
| `45_gift_cards` + `46_order_credit_columns` | HU-148 | Gift cards + saldo a favor |
| `47_bundles` | HU-168 | Bundles / kits |
| `48_redeem_store_value_rpc` + `49_refund_…` | HU-298 | Canje y reverso atómico de valor |
| `50_email_log` | HU-162 | Registro de correos |
| `51_email_templates` | HU-160 | Plantillas de correo editables |
| `52_redeem_idempotency` | HU-298 | Idempotencia por intento del canje |
| `53_rate_limit` | HU-300 | Rate-limit distribuido + bloqueo |

> **Tras aplicar nuevas migraciones**, regenera los tipos y vuelve a desplegar las apps afectadas.

---

## 5. Variables de entorno

Cada app tiene su `.env.example` con comentarios. Resumen de lo esencial:

### Compartidas (mismo valor entre apps que las usan)

| Variable | Apps | Descripción |
|----------|------|-------------|
| `SUPABASE_JWT_SECRET` | web, admin | Firma el JWT con `tenant_id`/`is_admin` → **RLS**. Joya de la corona, server-only. Falla-cerrado si falta. |
| `INTERNAL_API_SECRET` | web, admin, console | Secreto server-to-server (≥ 24 chars). |
| `PREVIEW_SIGNING_SECRET` | web, admin | HMAC del token de vista previa por tenant (HU-128). Mismo valor en ambas. |

### Storefront (`apps/web`)

- Supabase (tienda): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `DEFAULT_TENANT_ID`.
- Multi-tenant: `CONTROL_PLANE_URL`, `NEXT_PUBLIC_ROOT_DOMAIN`, `TENANT_RESOLUTION_STRICT`.
- Stack Auth (web): `NEXT_PUBLIC_HEXCLAVE_PROJECT_ID`, `NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY`, `HEXCLAVE_SECRET_SERVER_KEY`.
- URLs/preview: `NEXT_PUBLIC_SITE_URL`, `ADMIN_PREVIEW_ORIGIN`, `MAINTENANCE_MODE`.
- **Sentry (opcional)**: ver §6.

### Panel (`apps/admin`) y Consola (`apps/console`)

Ver sus `.env.example`. El admin comparte el proyecto Supabase de tienda; la consola usa el de plataforma.

> **No van por env** (se configuran desde el admin → Supabase): pasarelas de pago (Wompi/MercadoPago/Tu Compra/Bold → `payment_config`/`integration_instances`), emails (Resend) / WhatsApp / logo / nombre (`store_config`), y envíos Skydropx (`shipping_config`).

---

## 6. Monitoreo de errores — Sentry (HU-170)

### Qué es y para qué sirve

Sentry es el **APM / error-tracking de aplicación**: captura excepciones de runtime (servidor y navegador), las agrupa por tipo, adjunta stack + contexto (tenant, ruta) y permite **alertas**. Es distinto de los logs de infraestructura (Vercel/Supabase Logs): esos ya existen; Sentry agrupa y avisa.

### Cómo está integrado (desacoplado + guarded)

- El código llama a `reportError(err, { scope, tenantId, ... })` (abstracción `ErrorReporter` en `@merkiai/database`). **No depende directamente del SDK.**
- `apps/web/instrumentation.ts` → `register()` inicializa Sentry **solo si hay `SENTRY_DSN`** y registra el hook global `globalThis.__merkiaiCaptureException` que consume el `HookReporter`. También exporta `onRequestError` (errores de rutas/Server Components).
- `apps/web/instrumentation-client.ts` → inicializa Sentry en el navegador **solo si hay `NEXT_PUBLIC_SENTRY_DSN`**.
- El import del SDK es **no-literal** → el build no se acopla a Sentry.
- **Sin DSN, Sentry no se activa** y todo sigue con el `ConsoleReporter` (logs a stderr). Cero impacto en producción hasta encenderlo.
- Antes de enviar, se hace **scrubbing de PII/secretos** (email, teléfono, dirección, tokens, tarjetas).

### Activación

1. **Instalar**: ya está `@sentry/nextjs` en `apps/web/package.json` → `pnpm install`.
2. **Crear el proyecto en Sentry** (tipo *Next.js*) y copiar el **DSN**.
3. **Variables de entorno** (en Vercel, proyecto `web`):

   | Variable | Ámbito | Requerida |
   |----------|--------|-----------|
   | `SENTRY_DSN` | servidor | Sí (enciende el reporte) |
   | `NEXT_PUBLIC_SENTRY_DSN` | navegador | Para errores de cliente |
   | `SENTRY_ENVIRONMENT` / `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | ambos | Opcional (prod/preview/dev) |
   | `SENTRY_TRACES_SAMPLE_RATE` / `NEXT_PUBLIC_…` | ambos | Opcional (0 = solo errores) |
   | `SENTRY_AUTH_TOKEN` | build | Solo si se activan source maps |

4. **Deploy** de web.

### Dónde se gestiona

En el **panel de Sentry** (sentry.io o tu instancia): lista de errores agrupados, stack, tags (tenant/ruta), alertas, entornos y releases. **No** hay UI en el admin de Merkiai para esto; el flujo es *la app captura → envía a Sentry → se revisa/gestiona en el dashboard de Sentry*.

### Flujo resumido

```
error en checkout/webhook → reportError(err, ctx)
   → (si hay DSN) hook → Sentry.captureException (sin PII, con tags tenant/ruta)
   → aparece agrupado en el dashboard de Sentry → alerta → investigación con stack
```

### Pendiente opcional (AC-3)

Subir **source maps** en el build con `withSentryConfig` + `SENTRY_AUTH_TOKEN` para stacks legibles en producción. No está activado para no tocar el pipeline de build.

---

## 7. Scripts

| Script | Qué hace |
|--------|----------|
| `pnpm dev` | Dev de todas las apps (Turborepo) |
| `pnpm build` | Build de todo el workspace |
| `pnpm lint` | Lint |
| `pnpm format` | Prettier |
| `pnpm db:generate[:remote]` | Regenera tipos TS desde Supabase |
| `pnpm --filter @merkiai/web jest` | Tests del storefront |
| `pnpm --filter @merkiai/admin jest` | Tests del admin |
| `pnpm --filter @merkiai/database jest` | Tests de la capa de datos |

---

## 8. Verificación (antes de desplegar)

```bash
# type-check + tests por paquete/app
pnpm --filter @merkiai/database jest
pnpm --filter @merkiai/web jest
pnpm --filter @merkiai/admin jest
pnpm --filter @merkiai/web exec tsc --noEmit
pnpm --filter @merkiai/admin exec tsc --noEmit
```

Estado de referencia (v161): **database ~486 · web ~362 · admin ~260** tests verdes, type-check limpio.

---

## 9. Despliegue (resumen)

1. Aplicar migraciones pendientes en el **plano de tienda** (y plataforma si aplica).
2. Regenerar tipos si hubo migraciones nuevas.
3. Configurar variables de entorno en Vercel por app (incl. Sentry en web, si se usa).
4. Deploy. Detalle completo en `DEPLOYMENT.md`.

> **Cliente en producción:** `vps-coffee.com` es una tienda viva. Las features nuevas que tocan dinero/stock están *guarded* (solo corren si la tienda las tiene configuradas), de modo que no afectan el checkout existente.
