# HU-156 — Mapeo de usos de `createServerClient` (service-role) → plan de migración

> Inventario de los **81 archivos** que hoy usan `createServerClient()` (service-role, **omite RLS**). Objetivo: en multi-tenant, el **plano de tienda** deja de usar service-role y pasa a `createTenantClient` (rol `authenticated` + JWT `tenant_id`, sujeto a RLS); el service-role queda **acotado** a rutas privilegiadas server-to-server y al control plane. Base: ADR-001.

## Clasificación (3 buckets)

| Bucket | Qué es | Cliente destino | # |
|---|---|---|---|
| **TENANT** | Acceso a datos del tenant tras sesión de usuario (storefront/admin) | `createTenantClient` (RLS) | 66 |
| **PRIVILEGED** | Server-to-server sin sesión de usuario (webhooks, reconcile, stock, idempotencia) | `createServerClient` **acotado** + scoping explícito por `tenant_id` (o GUC fallback) | 12 |
| **INFRA** | La fábrica de clientes | ambos | 1 |

> Nota: hoy **no** hay archivos de *control plane* (es net-new en HU-172). El control plane usará service-role sobre la **BD de plataforma**, un proyecto Supabase distinto.

## Patrón de refactor (inversión de dependencias)

Las funciones de `packages/database/src/queries/*` hoy llaman `createServerClient()` **internamente**. Se refactorizan para **recibir el cliente por parámetro** (o un `DbContext`), de modo que el llamador decide:

```ts
// antes
export async function getProducts() {
  const supabase = createServerClient()   // service-role, omite RLS
  ...
}
// después
export async function getProducts(db: SupabaseClient) {  // inyectado
  ...  // el filtro por tenant lo impone la RLS del JWT; la query no cambia
}
```

- **Plano de tienda** (web/admin): el route/page construye `db = createTenantClient({ accessToken })` y lo pasa.
- **Privilegiado** (webhooks/cron): construye `db = createServerClient()` (service-role) y **filtra/asigna `tenant_id` explícitamente**, porque no hay JWT de usuario.

Esto cumple SOLID (inversión de dependencias), no rompe la firma de negocio y hace **testeable** el aislamiento.

---

## Bucket TENANT → `createTenantClient` (RLS)

### `packages/database/src/queries/*` (17) — inyectar cliente
`admin-config` · `blog` · `cart` · `content` · `coupons` · `home` · `media` · `nav` · `orders` · `pages` · `payment-config` · `products` · `shipping-config` · `shipping-profile` · `store-config` · `themes` · `variant-types`

> Todas dejan de llamar `createServerClient()` y reciben el cliente. Además ganan `tenant_id` en sus tablas (parte de la migración de datos).

### `apps/web` — storefront con sesión / host (11)
`(account)/account/page.tsx` · `(account)/account/profile/page.tsx` · `api/account/addresses/[id]/route.ts` · `api/account/addresses/route.ts` · `api/account/profile/route.ts` · `api/auth/welcome/route.ts` · `api/checkout/route.ts` · `api/checkout/status/route.ts` · `api/checkout/tucompra/finalize-daviplata/route.ts` · `api/newsletter/route.ts` · `checkout/page.tsx`

> `newsletter` es alta pública: el tenant se resuelve por **host** (no por usuario) y se emite un token con `tenant_id` de ese host. `checkout/status` y `finalize-daviplata` son de usuario (TENANT) pero **delegan la escritura autoritativa del estado a un helper PRIVILEGED** (reconcile).

### `apps/admin` — panel del tenant (rutas API, 22)
`blog/[id]` · `blog` · `categories/[id]` · `categories` · `cms/[resource]` · `export` · `import` · `media` · `nav` · `newsletter` · `newsletter/send` · `orders/[id]/notes` · `orders/[id]/payment-status` · `orders/[id]/reconcile-bold` · `orders/[id]/reconcile-tucompra` · `orders/[id]/status` · `products/[id]` · `products` · `themes/[id]` · `themes` · `upload` · `usuarios`
*(todas bajo `apps/admin/src/app/api/admin/…/route.ts`)*

### `apps/admin` — páginas (16) + auth (1)
`blog/[id]` · `blog` · `categorias` · `clientes/[email]` · `clientes` · `contenido` · `dashboard` · `media` · `nav` · `newsletter` · `pedidos/[id]` · `pedidos` · `productos/[id]` · `productos/nuevo` · `productos` · `usuarios` · **`lib/auth.ts`**

> `lib/auth.ts` (autorización por `profiles.role`) migra a **RBAC de Stack Auth** (Team/Project Permissions) + contexto de tenant; hoy lee `profiles` con service-role.
> Las rutas de reconcile del admin (`reconcile-bold/tucompra`) son disparadas por el admin (TENANT) pero su escritura de estado usa el helper PRIVILEGED.

---

## Bucket PRIVILEGED → `createServerClient` acotado (bypass RLS, scoping explícito)

Actor = sistema/pasarela, **sin** sesión de usuario → no hay JWT de tenant. Mantienen service-role, pero **resuelven el `tenant_id`** desde la orden/payload y lo asignan/filtran explícitamente.

### `apps/web` (8)
`api/webhooks/bold/route.ts` · `api/webhooks/mercadopago/route.ts` · `api/webhooks/skydropx/route.ts` · `api/webhooks/tucompra/route.ts` · `api/webhooks/wompi/route.ts` · `lib/bold-reconcile.ts` · `lib/tucompra-reconcile.ts` · `lib/shipping/shipments.ts`

### `packages/database/src/lib` (4)
`bold-reconcile.ts` · `tucompra-reconcile.ts` · `stock.ts` (RPC de stock) · `webhook-idempotency.ts` (tabla `processed_webhook_events`, solo service-role)

> Alternativa más estricta (opcional): en vez de service-role, usar el **fallback GUC** (`SET LOCAL app.current_tenant`) + rol dedicado, para que incluso estas rutas queden bajo RLS. Recomendado a mediano plazo; para arrancar, service-role acotado + asignación explícita de `tenant_id` es aceptable.

---

## Bucket INFRA (1)

`packages/database/src/client.ts` — se amplía:
- `createTenantClient({ url, anonKey, accessToken })` (re-exporta desde `@merkiai/tenancy`) — plano de tienda.
- `createServerClient()` (service-role) — **se conserva** pero se renombra su intención a "privilegiado"; su uso queda restringido a los 12 PRIVILEGED y al control plane. Añadir lint/regla para prohibirlo en rutas de usuario.

---

## Variables de entorno que se conservan por proyecto (fin de la migración)

Tras HU-156 hay **3 despliegues** y **2 proyectos Supabase** (plano de tienda + plataforma). Estas son las envs que quedan en cada uno:

### 1) `merkiai-web` — storefront (proyecto Supabase del **plano de tienda**)
| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Proyecto del plano de tienda |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Anon/publishable (rol público; autz por RLS+JWT) |
| `SUPABASE_JWT_SECRET` | Firmar el JWT de tenant (Legacy secret HS256) — server-only |
| `SUPABASE_SERVICE_ROLE_KEY` | **Solo** rutas PRIVILEGED (webhooks/reconcile/stock). Prohibido en queries de usuario |
| `NEXT_PUBLIC_HEXCLAVE_PROJECT_ID` / `…PUBLISHABLE_CLIENT_KEY` / `HEXCLAVE_SECRET_SERVER_KEY` | Stack Auth — proyecto **web** (compradores) |
| `NEXT_PUBLIC_ROOT_DOMAIN` | Resolver tenant por subdominio |
| `CONTROL_PLANE_URL` | API interna: `host→tenant_id→db_ref` |
| `NEXT_PUBLIC_SITE_URL`, `MAINTENANCE_MODE` | Existentes |

### 2) `merkiai-admin` — panel (proyecto Supabase del **plano de tienda**)
| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Proyecto del plano de tienda |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Anon/publishable |
| `SUPABASE_JWT_SECRET` | Firmar el JWT de tenant del admin |
| `NEXT_PUBLIC_HEXCLAVE_PROJECT_ID` / `…PUBLISHABLE_CLIENT_KEY` / `HEXCLAVE_SECRET_SERVER_KEY` | Stack Auth — proyecto **admin** (distinto al de web) |
| `CONTROL_PLANE_URL` | Resolución/entitlements vía control plane |
| ~~`SUPABASE_SERVICE_ROLE_KEY`~~ | **Se elimina**: el admin opera como `authenticated` bajo RLS |

### 3) `merkiai-control-plane` — plataforma (proyecto Supabase de **plataforma**, NUEVO)
| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Proyecto de **plataforma** (distinto al del plano de tienda) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Anon del proyecto de plataforma |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role del proyecto de plataforma (aquí **sí** es la vía normal) |
| `NEXT_PUBLIC_HEXCLAVE_PROJECT_ID` / `…PUBLISHABLE_CLIENT_KEY` / `HEXCLAVE_SECRET_SERVER_KEY` | Stack Auth — proyecto **control-plane** (operadores de plataforma) |
| `BILLING_PROVIDER` / `BILLING_API_KEY` / `BILLING_WEBHOOK_SECRET` | Facturación por suscripción a los tenants |

**Notas**
- Hay **dos `SUPABASE_SERVICE_ROLE_KEY` distintas**: la del plano de tienda (solo web, para PRIVILEGED) y la de plataforma (control plane). No mezclar.
- Las credenciales de pasarelas y Skydropx **siguen** en la BD (`payment_config`/`shipping_config`), no en env.
- `SUPABASE_JWT_SECRET` es el **Legacy JWT secret** hoy; si se migra a Third-Party Auth (Stack Auth + JWKS), se reemplaza por la configuración del issuer y deja de firmarse el token localmente.
