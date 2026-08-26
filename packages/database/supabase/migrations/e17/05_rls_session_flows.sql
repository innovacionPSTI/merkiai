-- =============================================================================
-- E17 · HU-156 — RLS de flujos con sesión (comprador authenticated)
-- =============================================================================
-- Aísla los datos PROPIOS del comprador (customers, addresses, cart, orders) bajo
-- rol `authenticated`. El JWT lleva `sub` = id de usuario (Stack Auth) + claim
-- `tenant_id`. Vínculo usuario↔cliente: customers.stack_id = auth.jwt()->>'sub'.
--
-- Modelo:
--   · Comprador (authenticated): ve/gestiona SOLO lo suyo dentro de su tenant.
--   · orders: SELECT-only para el comprador (crear/actualizar = privilegiado
--     server-to-server: order_number, pago, stock, webhooks, reconcile).
--   · Operador de tienda (admin): sigue en vía privilegiada (HU-158).
--   · service-role omite RLS (SSR/creación de pedidos actual no se rompe).
--
-- ⚠️ EFECTO: tras aplicar, una lectura `authenticated` sin JWT de tenant/sub
--    válido devuelve 0 filas (fail-closed). Va ACOPLADO al cableado gated por
--    `SESSION_RLS_ENABLED` en el storefront. **Aplicar en STAGING y validar
--    aislamiento entre compradores (A no ve datos de B) antes de producción.**
--
-- Requiere e17/01 (tenant_id) + 03 (únicos) + 04 (FKs compuestas). Idempotente.
-- Aplicar en el proyecto Supabase del PLANO DE TIENDA.
-- =============================================================================

-- Asegura RLS habilitado (no-op si ya lo estaba).
alter table public.customers          enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.cart_items         enable row level security;
alter table public.orders             enable row level security;

-- customers: el comprador ve/edita su propia ficha
drop policy if exists customers_own on public.customers;
create policy customers_own on public.customers for all to authenticated
  using      (tenant_id = (auth.jwt()->>'tenant_id')::uuid and stack_id = auth.jwt()->>'sub')
  with check (tenant_id = (auth.jwt()->>'tenant_id')::uuid and stack_id = auth.jwt()->>'sub');

-- customer_addresses: por propiedad del cliente
drop policy if exists addresses_own on public.customer_addresses;
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
drop policy if exists cart_own on public.cart_items;
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
drop policy if exists orders_own_read on public.orders;
create policy orders_own_read on public.orders for select to authenticated
  using (tenant_id = (auth.jwt()->>'tenant_id')::uuid
         and customer_id in (select id from public.customers
                             where stack_id = auth.jwt()->>'sub'
                               and tenant_id = (auth.jwt()->>'tenant_id')::uuid));

-- =============================================================================
-- Rollback (si un flujo se rompe en staging):
--   drop policy if exists customers_own      on public.customers;
--   drop policy if exists addresses_own      on public.customer_addresses;
--   drop policy if exists cart_own           on public.cart_items;
--   drop policy if exists orders_own_read    on public.orders;
--   (y, si se requiere, deshabilitar RLS en esas tablas)
-- =============================================================================
