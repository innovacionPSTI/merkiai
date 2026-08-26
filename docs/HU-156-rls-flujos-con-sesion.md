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

## Orden de cableado (tras validar RLS)
1. Aplicar las políticas en staging + prueba de aislamiento entre compradores.
2. Cablear las páginas/rutas de **cuenta** (`/account/*`, `api/account/*`) a `getRequestUserTenantDb(user.id)` (pasar el cliente a las queries `getOrdersByCustomer*`, addresses, profile).
3. Checkout: las **lecturas** del comprador con el cliente authenticated; la **creación de la orden + stock + webhooks** se quedan privilegiadas (order_number, pago, reconcile).
4. `customers` sin `stack_id` (guest checkout) se crean/gestionan por la vía privilegiada.
