-- =============================================================================
-- E17 · HU-156 — Políticas RLS tenant-scoped para el catálogo (Opción B: anon)
-- =============================================================================
-- Reemplaza las políticas de lectura pública amplias por versiones acotadas por
-- tenant. Aplica a los roles `anon` y `authenticated`: el storefront público
-- lee con un JWT de rol `anon` que porta `tenant_id` (ver getTenantDb + Opción B
-- del ADR-001). El `service-role` sigue omitiendo RLS (SSR actual no se rompe).
--
-- ⚠️ EFECTO: tras aplicar, una lectura con la anon key **sin** JWT de tenant
--    (sin claim tenant_id) devuelve 0 filas (fail-closed). Por eso este archivo
--    va ACOPLADO al cableado de `getTenantDb` en el storefront. **Aplicar primero
--    en STAGING** y validar el catálogo antes de producción.
--
-- Requiere que las tablas ya tengan `tenant_id` (e17/01_tenant_id.sql). Idempotente.
-- Aplicar en el proyecto Supabase del PLANO DE TIENDA.
-- =============================================================================

-- Asegura RLS habilitado (no-op si ya lo estaba).
alter table public.categories       enable row level security;
alter table public.products         enable row level security;
alter table public.product_variants enable row level security;

-- categories
drop policy if exists categories_public_read on public.categories;
drop policy if exists categories_tenant_read on public.categories;
create policy categories_tenant_read on public.categories
  for select to anon, authenticated
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- products (solo activos)
drop policy if exists products_public_read on public.products;
drop policy if exists products_tenant_read on public.products;
create policy products_tenant_read on public.products
  for select to anon, authenticated
  using (active = true and tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- product_variants (solo activos)
drop policy if exists product_variants_public_read on public.product_variants;
drop policy if exists product_variants_tenant_read on public.product_variants;
create policy product_variants_tenant_read on public.product_variants
  for select to anon, authenticated
  using (active = true and tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- =============================================================================
-- Rollback (si el catálogo se rompe en staging): restaurar las políticas previas.
--   drop policy if exists categories_tenant_read on public.categories;
--   create policy categories_public_read on public.categories for select using (true);
--   drop policy if exists products_tenant_read on public.products;
--   create policy products_public_read on public.products for select using (active = true);
--   drop policy if exists product_variants_tenant_read on public.product_variants;
--   create policy product_variants_public_read on public.product_variants for select using (active = true);
-- =============================================================================
