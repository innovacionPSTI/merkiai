# Pruebas E2E (Playwright) — configuración y puesta a punto

Guía paso a paso para dejar corriendo las pruebas end-to-end de Merkiai. Las E2E
validan la **integración real** (storefront + admin + webhooks → ledger), no la
lógica de unidad (de eso se encargan los ~1.350 tests de Jest). Mantenlas
**delgadas**: pocos caminos felices + los casos de riesgo del corte venta→ledger.

> Paquete: `apps/e2e` · Framework: **Playwright** · No apunta nunca a producción.

---

## 0. Qué se prueba (alcance)

Prioridad por riesgo (lo nuevo y transversal primero):

1. **Venta → ledger** (E18·HU-178): compra en storefront → pago aprobado → baja el
   stock en el libro; terminado `al_vender` consume componentes; cancelar repone.
2. **No sobreventa / 409** en variantes enlazadas con saldo inicializado; tienda
   **solo-catálogo** sin cambios (regresión cero del flag retirado).
3. **Multi-ubicación** (E18): venta sella la sede predeterminada, transferencia
   mueve disponible entre sedes, alertas por ubicación.
4. **Admin Operaciones** (E24): crear ítem, recibir compra, completar producción,
   cotización→orden.
5. **Aislamiento entre tenants (RLS)**: el tenant A no ve/toca datos del B.

---

## 1. Prerrequisitos

- Node 20+, **pnpm 9** (ya es el `packageManager` del repo).
- **Supabase CLI** para la base local (o una *branch/preview DB* de Supabase).
- Dependencias del monorepo instaladas: `pnpm install` en la raíz.

---

## 2. Base de datos de prueba (desechable)

**Nunca uses producción.** Dos opciones:

### Opción A — Supabase local (recomendada para dev)

```bash
supabase start           # Postgres + API locales
```

Aplica **todas** las migraciones del repo (incluye `e17/*` y `platform/*`) y los
`seeds` con el mismo proceso que usas normalmente para migrar
(`packages/database/supabase/{migrations,platform,seeds}`). El estado debe quedar
con el schema completo hasta la última migración (`e17/72_locations.sql`).

### Opción B — Branch/preview DB en Supabase (recomendada para CI)

Crea una branch efímera, aplica migraciones+seeds y usa su URL + clave service-role
en las variables `E2E_SUPABASE_*`.

---

## 3. Tenant de prueba + entitlements + usuario

Las E2E necesitan **un tenant conocido** con su plan de Operaciones encendido y un
**usuario admin** de ese tenant.

1. **Crea el tenant** de prueba con el `E2E_TENANT_ID` del `.env` (vía tu flujo de
   aprovisionamiento de la consola, o un `insert` directo en la tabla de tenants).
   Repite para `E2E_TENANT_B_ID` (aislamiento RLS).
2. **Enciende los entitlements** del tenant de prueba: `inventory`, `multi_location`,
   `price_lists`, `quotes` (desde el editor de planes de la consola, HU-239, o el
   endpoint interno de entitlements). Sin `inventory` el corte al ledger no actúa.
3. **Crea el usuario admin** (Stack Auth) con `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD`
   y vincúlalo al tenant de prueba (perfil con su `tenant_id`, HU-158).
4. **Mapea el host→tenant**: el storefront resuelve el tenant por *host*. Registra
   `E2E_TENANT_HOST` (p. ej. `tienda-test.localhost`) como dominio del tenant.

> El **catálogo + operaciones de ejemplo** (café + receta `al_vender`) los siembra
> automáticamente `global-setup` llamando al endpoint interno de seed
> (`apps/e2e/lib/seed.ts`, reusa el preset de HU-410) cuando `E2E_SEED=1` y
> `E2E_INTERNAL_SECRET` está configurado. El **saldo de apertura** se materializa
> con el endpoint de backfill (HU-178·F3a), también desde `global-setup`.

### Subdominios locales

`*.localhost` resuelve a 127.0.0.1 en navegadores modernos sin tocar `/etc/hosts`.
Si tu resolver no lo hace, agrega en `/etc/hosts`:

```
127.0.0.1 tienda-test.localhost tienda-b-test.localhost
```

---

## 4. Instalar Playwright

```bash
cd apps/e2e
pnpm install                 # instala @playwright/test (si no corrió en la raíz)
pnpm run install:browsers    # descarga Chromium + dependencias del SO
cp .env.example .env         # y completa los valores (ver sección 5)
```

---

## 5. Variables de entorno (`apps/e2e/.env`)

Copiadas de `.env.example`. Las clave:

| Variable | Para qué |
|---|---|
| `E2E_WEB_URL` / `E2E_ADMIN_URL` / `E2E_CONSOLE_URL` | URLs de las apps corriendo |
| `E2E_TENANT_ID` / `E2E_TENANT_HOST` | tenant de prueba (A) |
| `E2E_TENANT_B_ID` / `E2E_TENANT_B_HOST` | tenant para aislamiento RLS |
| `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` | usuario admin de prueba (Stack Auth) |
| `E2E_INTERNAL_SECRET` | `INTERNAL_API_SECRET` del admin (para el seed) |
| `E2E_SUPABASE_URL` / `E2E_SUPABASE_SERVICE_ROLE_KEY` | acceso directo a la DB |
| `E2E_SEED` | `1` para sembrar el tenant en `global-setup` |

---

## 6. Levantar las apps

En otra terminal, con las variables de entorno de las apps apuntando a la **DB de
prueba**:

```bash
pnpm dev            # turbo: web :3000, admin :3001, console :3002
# o, más parecido a prod:
pnpm build && pnpm start
```

Verifica que respondan `E2E_WEB_URL` y `E2E_ADMIN_URL`.

---

## 7. Correr las pruebas

```bash
cd apps/e2e
pnpm test                 # headless, todos los proyectos
pnpm run test:headed      # viendo el navegador
pnpm run test:ui          # modo UI interactivo (ideal para depurar)
pnpm run report           # abre el último reporte HTML
```

`global-setup` corre una sola vez: siembra (si `E2E_SEED=1`), inicia sesión en el
admin y guarda la sesión en `apps/e2e/.auth/admin.json`, y ejecuta el backfill.

---

## 8. Estructura del paquete

```
apps/e2e/
├─ playwright.config.ts     # proyectos: admin (autenticado) y storefront (anónimo)
├─ global-setup.ts          # seed + login + storageState + backfill
├─ lib/seed.ts              # siembra vía endpoint interno (preset HU-410)
├─ tests/
│  ├─ operations.admin.spec.ts     # tablero, crear ítem, cotización→orden
│  ├─ rls-isolation.admin.spec.ts  # aislamiento multi-tenant
│  └─ sale-ledger.store.spec.ts    # compra → webhook → ledger (plantilla)
└─ .env.example
```

Convención de nombres: `*.admin.spec.ts` corre en el proyecto **admin** (con sesión);
`*.store.spec.ts` en el proyecto **storefront** (anónimo).

Algunas specs están marcadas con `test.fixme(...)`: son **plantillas** del recorrido
cuyos selectores/datos concretos del storefront y del webhook de pagos debes cablear
a tu tienda de prueba antes de activarlas (quita el `.fixme`).

---

## 9. Pagos: simular el webhook (sin pasarela real)

No uses pasarelas reales en E2E. Tras crear la orden, dispara el **webhook del
proveedor de pruebas** con un payload de test (firmado si aplica) contra el endpoint
correspondiente del storefront (`/api/webhooks/<proveedor>`), usando el
`order_number` recién creado. Eso ejecuta `applyStockForOrder` → corte al ledger.
Para cancelaciones, dispara el evento que marca la orden como rechazada/cancelada →
`restoreStockForOrder` → reverso en el ledger.

---

## 10. Aislamiento de datos entre corridas

- **CI**: parte de una DB fresca por corrida (branch/preview o `supabase db reset`).
- **Local**: el seed es idempotente; para repetir desde cero, re-aplica migraciones
  + seeds o usa un `E2E_TENANT_ID` nuevo.
- Evita que dos corridas compartan el mismo tenant en paralelo.

---

## 11. CI (GitHub Actions) — esquema

```yaml
# .github/workflows/e2e.yml (esquema de referencia)
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install
      - run: supabase start           # + aplicar migraciones/seeds del repo
      - run: pnpm build
      - run: pnpm start &              # levantar apps en background
      - run: pnpm --filter @merkiai/e2e run install:browsers
      - run: pnpm --filter @merkiai/e2e test
        env:
          E2E_WEB_URL: http://tienda-test.localhost:3000
          E2E_ADMIN_URL: http://localhost:3001
          E2E_SEED: '1'
          # … resto de E2E_* como secrets
      - uses: actions/upload-artifact@v4
        if: always()
        with: { name: playwright-report, path: apps/e2e/playwright-report }
```

---

## 12. Problemas comunes

- **Redirige a `sign-in` en specs admin** → el `storageState` no se generó; revisa
  credenciales y los selectores de login en `global-setup.ts`.
- **El storefront no encuentra el tenant** → falta mapear `E2E_TENANT_HOST` al tenant,
  o el navegador no resuelve `*.localhost`.
- **El corte al ledger no descuenta** → el tenant no tiene `inventory`, la variante no
  está enlazada a un `stock_item`, o falta el backfill (saldo de apertura).
- **Backfill devuelve 402** → el plan del tenant no tiene `inventory` (esperado para
  solo-catálogo).
- **Tests lentos/flaky** → sube `workers`, usa `trace: on-first-retry` (ya activo) y
  revisa el trace en el reporte.
```
