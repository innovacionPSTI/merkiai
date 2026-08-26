# HU-156 — RLS de flujos con sesión (cuenta, checkout)

> Completa el aislamiento más allá del catálogo público: los datos **propios del usuario** (customers, addresses, orders, cart) deben verse bajo RLS con rol `authenticated`, no con service-role. ⚠️ Un error de política aquí = **un comprador viendo datos de otro** → validar aislamiento entre compradores en staging antes de cablear.

## Enabler (implementado)
`apps/web/src/lib/tenant-db.ts`:
- `getUserTenantDb(userId, tenantId?)` / `getRequestUserTenantDb(userId)` → cliente con rol **`authenticated`**; el JWT lleva `sub` = id del usuario (Stack Auth) + claim `tenant_id`.

Las políticas de abajo leen `auth.jwt()->>'sub'` (usuario) y `auth.jwt()->>'tenant_id'` (tenant). El vínculo usuario↔cliente es `customers.stack_id = sub`.

## Modelo de acceso
- **Comprador (authenticated):** ve/gestiona **solo lo suyo** dentro de su tenant.
- **Operador de tienda (admin):** ve **todo su tenant** → sigue en vía privilegiada (service-role/GUC) por ahora; su RLS por `store:*` es trabajo aparte (HU-158).
- **Creación de pedidos / webhooks / stock:** **privilegiado** (server-to-server), no el comprador → `orders` es SELECT-only para `authenticated`.

## Políticas RLS (staging — aplicar tras revisar; requiere e17/01+03+04)
```sql
-- customers: el comprador ve/edita su propia ficha
create policy customers_own on public.customers for all to authenticated
  using      (tenant_id = (auth.jwt()->>'tenant_id')::uuid and stack_id = auth.jwt()->>'sub')
  with check (tenant_id = (auth.jwt()->>'tenant_id')::uuid and stack_id = auth.jwt()->>'sub');

-- customer_addresses: por propiedad del cliente
create policy addresses_own on public.customer_addresses for all to authenticated
  using      (tenant_id = (auth.jwt()->>'tenant_id')::uuid
              and customer_id in (select id from public.customers
                                  where stack_id = auth.jwt()->>'sub'
                                    and tenant_id = (auth.jwt()->>'tenant_id')::uuid))
  with check (tenant_id = (auth.jwt()->>'tenant_id')::uuid
              and customer_id in (select id from public.customers
                                  where stack_id = auth.jwt()->>'sub'
                                    and tenant_id = (auth.jwt()->>'tenant_id')::uuid));

-- cart_items: gestión del carrito propio
create policy cart_own on public.cart_items for all to authenticated
  using      (tenant_id = (auth.jwt()->>'tenant_id')::uuid
              and customer_id in (select id from public.customers
                                  where stack_id = auth.jwt()->>'sub'
                                    and tenant_id = (auth.jwt()->>'tenant_id')::uuid))
  with check (tenant_id = (auth.jwt()->>'tenant_id')::uuid
              and customer_id in (select id from public.customers
                                  where stack_id = auth.jwt()->>'sub'
                                    and tenant_id = (auth.jwt()->>'tenant_id')::uuid));

-- orders: el comprador SOLO lee los suyos (crear/actualizar es privilegiado)
create policy orders_own_read on public.orders for select to authenticated
  using (tenant_id = (auth.jwt()->>'tenant_id')::uuid
         and customer_id in (select id from public.customers
                             where stack_id = auth.jwt()->>'sub'
                               and tenant_id = (auth.jwt()->>'tenant_id')::uuid));
```

## Validación de aislamiento (obligatoria en staging)
1. Dos compradores (A y B) con cuenta y pedidos en el mismo tenant.
2. Con el JWT de A (rol authenticated), `select * from orders` → **solo** pedidos de A.
3. Intentar leer/actualizar la ficha/cart/dirección de B → **0 filas / rechazo**.
4. `getUserTenantDb` **nunca** usa service-role → verificado.

## Migración y gate (implementado)
- **SQL:** `packages/database/supabase/migrations/e17/05_rls_session_flows.sql` (idempotente): habilita RLS + políticas `customers_own`, `addresses_own`, `cart_own`, `orders_own_read`.
- **Fail-closed (hardening):** `apps/web/src/lib/tenant-db.ts` → `getRequestUserDb(userId)` y `getRequestCatalogDb()` devuelven **siempre** el cliente tenant-scoped (`authenticated`/`anon`) y **exigen `SUPABASE_JWT_SECRET`**; si falta, **lanzan** (no hay degradación a service-role en el plano de tienda). Se eliminó el flag `SESSION_RLS_ENABLED` y los fallbacks `?? createServerClient()` de las rutas de comprador → no existe vía que opere sin RLS. Escrituras privilegiadas (crear pedido, stock, webhooks, `ensureCustomer`) siguen por su vía server-to-server, no por el comprador. Prueba: `tenant-db.test.ts` (lanza sin secreto).

## Orden de cableado
1. ✅ Aplicar `e17/05` en **staging** + prueba de aislamiento entre compradores (obligatoria, ver arriba).
2. ✅ **Cuenta + carrito cableados** (gated): lecturas `/account`, `/account/orders` (por `customer_id`), `/account/orders/[id]` (+guardia por email); mutaciones `api/account/profile` (GET/PATCH), `api/account/addresses` (GET/POST), **`api/account/addresses/[id]` (PATCH/DELETE)** y **`api/account/cart` (GET/POST/DELETE)** → todas con `ensureCustomer` (garantiza fila, evita 404) + cliente `authenticated` cuando el flag está activo + `tenant_id` explícito en escrituras (dirección y carrito). Tipos: `tenant_id` tipado en `customers`/`customer_addresses`/`orders`/`cart_items`.
3. Lecturas del comprador en checkout: cubiertas por `api/account/addresses` (direcciones guardadas) y `api/account/cart` (sync de carrito), ya cableadas.
4. ✅ **Contenido del storefront (RLS por tenant)**: migración `e17/06_rls_content.sql` — reemplaza las políticas `*_public_read` amplias por `*_tenant_read` acotadas por `tenant_id` en `pages`/`page_sections`/`section_items`/`blog_posts`/`nav_items`. La página CMS `(public)/[slug]` lee con `getRequestCatalogDb()` (host→tenant). **Pendiente:** cablear blog y `nav_items` (Navbar) al cliente por host, y **config singletons por tenant** (`store_config`/`admin_config`/`payment_config`/`shipping_config`: hoy fila `id=1`; su conversión a fila-por-tenant + seed en el onboarding es parte de HU-158).
3. 🔲 Checkout: **lecturas** del comprador con el cliente authenticated; la **creación de orden + stock + webhooks** se quedan privilegiadas (order_number, pago, reconcile).
4. `customers` sin `stack_id` (guest checkout) se crean/gestionan por la vía privilegiada.

## Enlace comprador↔customer↔order (bug de fondo corregido)
Antes: **nadie creaba filas en `customers`** (el registro solo tocaba Stack Auth) y el checkout **nunca** seteaba `orders.customer_id` (siempre `null`) → con RLS activo el comprador no vería ningún pedido. Corregido (decisión: provisioning on-demand + reclamo por email):
- `ensureCustomer({stackUserId,email,name,tenantId})` en `@merkiai/database` (service-role, idempotente): resuelve por `stack_id` → por `email` (adjunta `stack_id` a un cliente-invitado) → o inserta; y **reclama** los pedidos de invitado del mismo email (`orders.customer_id` = customer). Pruebas: `packages/database/src/queries/__tests__/customers.test.ts` (3).
- **Checkout** (`api/checkout/route.ts`): con sesión, `ensureCustomer` + `customer_id` en las 3 rutas de `createOrder` (manual/tucompra/pasarela). Invitado → `customer_id` null, reclamado al registrarse.
- **Cuenta**: provisioning al entrar a `/account` y `/account/orders`; la lista lee por `customer_id` (`getOrdersByCustomer`), consistente con `orders_own_read`.
> Nota: los tipos generados (`types.ts`) aún no incluyen `tenant_id`; `ensureCustomer` usa una vista sin tipar acotada para esa columna (regenerar tipos es trabajo aparte).

## Requisito de despliegue (RLS obligatoria)
`apps/web` **requiere `SUPABASE_JWT_SECRET`** (Legacy JWT secret) en **todos** los entornos que sirven la tienda + migraciones `e17/02` (catálogo), `e17/05` (sesión) y `e17/06` (contenido) aplicadas. Sin el secreto, el storefront y las rutas de comprador **fallan de forma explícita** (fail-closed, por diseño). No hay flag ni fallback a service-role. Verificar en prod: login → perfil/direcciones/carrito/"Mis pedidos" muestran solo lo del comprador, y un pedido nuevo trae `customer_id`.
