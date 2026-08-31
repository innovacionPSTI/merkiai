-- =============================================================================
-- E17 · HU-158 (Etapa 2) — Políticas RLS del PANEL ADMIN (piloto: productos)
-- =============================================================================
-- El admin deja de usar service-role y pasa a un cliente RLS con JWT
-- `role=authenticated` + `tenant_id` + `is_admin=true` (ver apps/admin/src/lib/admin-db.ts).
-- Estas políticas `*_admin_all` le dan CRUD COMPLETO sobre las filas de SU tenant.
--
-- Son ADITIVAS (RLS es permisiva/OR): conviven con las de lectura del storefront
-- (`*_tenant_read` anon/authenticated) y las del comprador (`*_own`). Un comprador
-- (authenticated SIN `is_admin`) NO gana escritura; solo el JWT del panel.
--
-- PILOTO: solo el módulo de productos (products/product_variants/categories).
-- El resto de tablas del admin se agregan en la Etapa 3, una vez validado en vivo.
-- Idempotente. Aplicar en el proyecto Supabase de admin/web.
-- =============================================================================

-- Predicado admin: pertenece al tenant del JWT y el token es del panel.
--   tenant_id = (auth.jwt()->>'tenant_id')::uuid  AND  is_admin = true

-- products
drop policy if exists products_admin_all on public.products;
create policy products_admin_all on public.products
  for all to authenticated
  using      (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid and coalesce((auth.jwt() ->> 'is_admin')::boolean, false))
  with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid and coalesce((auth.jwt() ->> 'is_admin')::boolean, false));

-- product_variants
drop policy if exists product_variants_admin_all on public.product_variants;
create policy product_variants_admin_all on public.product_variants
  for all to authenticated
  using      (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid and coalesce((auth.jwt() ->> 'is_admin')::boolean, false))
  with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid and coalesce((auth.jwt() ->> 'is_admin')::boolean, false));

-- categories
drop policy if exists categories_admin_all on public.categories;
create policy categories_admin_all on public.categories
  for all to authenticated
  using      (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid and coalesce((auth.jwt() ->> 'is_admin')::boolean, false))
  with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid and coalesce((auth.jwt() ->> 'is_admin')::boolean, false));

-- variant_types (plantillas de atributo por tenant; el form de producto las lee)
alter table public.variant_types enable row level security;
drop policy if exists variant_types_admin_all on public.variant_types;
create policy variant_types_admin_all on public.variant_types
  for all to authenticated
  using      (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid and coalesce((auth.jwt() ->> 'is_admin')::boolean, false))
  with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid and coalesce((auth.jwt() ->> 'is_admin')::boolean, false));

-- =============================================================================
-- SIGUIENTE (Etapa 3): mismas `*_admin_all` para orders, customers, customer_addresses,
-- profiles, pages, page_sections, section_items, blog_posts, nav_items, coupons,
-- testimonials, themes, media_assets, variant_types, banners, newsletter_subscribers,
-- shipping_profiles, y los 4 config (store/payment/admin/shipping) — al cablear cada módulo.
-- =============================================================================
