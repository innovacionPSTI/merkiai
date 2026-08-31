# HU-216 · Auditoría anti service-role en el storefront (RLS por tenant)

**Contexto.** En el plano de tienda (`apps/web`), `createServerClient()` usa la **service-role key**, que **omite RLS**. En multi-tenant eso significa que cualquier lectura/escritura de datos de tenant hecha con ese cliente puede **cruzar tenants** (leer/escribir datos de otra tienda). La frontera dura de aislamiento es la **RLS por `tenant_id`** (ADR-001).

**Regla.** En el storefront **no** se usa `createServerClient`. Se usa:
- `getRequestCatalogDb()` — rol `anon` + JWT con `tenant_id` (catálogo/contenido/config pública, resuelto por host).
- `getRequestUserDb(userId)` — rol `authenticated` + `tenant_id` (datos con sesión: perfil, direcciones, carrito).

Ambos **fail-closed**: exigen `SUPABASE_JWT_SECRET`; si falta, lanzan (no degradan a service-role).

## Enforcement (lint)

`apps/web/.eslintrc.json` → `no-restricted-imports` convierte en **error de lint** cualquier import de `createServerClient` desde `@merkiai/database` en el storefront. Un import nuevo en una página/componente **rompe el lint**. La regla está verificada (dispara ante una violación).

## Allowlist (service-role legítimo, máquina-a-máquina)

Rutas **sin sesión ni host** que requieren service-role (no hay JWT de tenant que acuñar). Están exentas de la regla vía `overrides`, pero **deben acotar por el `tenant_id` de la entidad que procesan**:

| Archivo/glob | Uso | Estado tenant-scoping |
|---|---|---|
| `src/app/api/webhooks/**` | callbacks de pago/envío (MP, TuCompra, Bold, Wompi, Skydropx) | ⏳ **pendiente**: leen `payment_config`/`store_config` sin tenant → cargan la config del **default** (llaves de pasarela equivocadas para tenants no-default). Fix: resolver `order.tenant_id` y leer la config de ese tenant. |
| `src/app/api/checkout/**` | crea pedidos (no hay policy de INSERT para `authenticated`), status, finalize | ✅ el pedido se crea con `tenant_id` (resuelto por host); ⏳ `saveAddressForUser` debe setear `tenant_id`. |
| `src/app/api/auth/welcome/route.ts` | alta del comprador post-registro | ✅ resuelve tenant por host + `ensureCustomer(tenantId)`. |
| `src/app/api/newsletter/route.ts` | suscripción | ✅ `tenant_id` + `onConflict tenant_id,email`. |
| `src/lib/bold-reconcile.ts`, `src/lib/tucompra-reconcile.ts` | reconciliación de estado de pago | ⏳ mismo pendiente de config-por-tenant que los webhooks. |
| `src/lib/shipping/shipments.ts` | creación de envíos | ⏳ config de envío por tenant. |

## Fugas corregidas (v60)

- `(account)/account/profile/page.tsx`, `checkout/page.tsx`: leían `customers` con service-role → `getRequestUserDb`.
- `api/auth/welcome`, `api/newsletter`: no ponían `tenant_id` → resolución por host + escritura acotada (**causa de que el comprador cayera al tenant default**).
- `types.ts`: `newsletter_subscribers.tenant_id`.

## Pendiente (cierre de HU-216)

1. **Webhooks/reconcile/shipping** → leer `payment_config`/`store_config`/`shipping_config` del **tenant del pedido** (`order.tenant_id`), no del default.
2. **`checkout saveAddressForUser`** → setear `tenant_id`.
3. Auditar páginas de contenido restantes (`blog`, `[slug]`, PDP) — el catálogo y la home ya están scoped.
