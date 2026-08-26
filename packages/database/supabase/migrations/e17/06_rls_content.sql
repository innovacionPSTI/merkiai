-- =============================================================================
-- E17 · HU-156 — RLS tenant-scoped para el CONTENIDO del storefront
-- =============================================================================
-- Reemplaza las políticas de lectura pública AMPLIAS (`*_public_read`, que
-- devolvían filas de cualquier tenant) por versiones acotadas por tenant, igual
-- que el catálogo (e17/02). Aplica a `anon` y `authenticated`: el storefront lee
-- con un JWT rol `anon` que porta `tenant_id`. El `service-role` (SSR/admin)
-- sigue omitiendo RLS.
--
-- ⚠️ EFECTO: tras aplicar, una lectura con la anon key SIN JWT de tenant devuelve
--    0 filas (fail-closed). Va acoplado a `getRequestCatalogDb` en el storefront.
--    Aplicar primero en STAGING.
--
-- Requiere e17/01 (tenant_id en pages/page_sections/section_items/blog_posts/
-- nav_items). Idempotente. Aplicar en el proyecto Supabase del PLANO DE TIENDA.
-- =============================================================================

-- pages (solo habilitadas)
alter table public.pages enable row level security;
drop policy if exists pages_public_read on public.pages;
drop policy if exists pages_tenant_read on public.pages;
create policy pages_tenant_read on public.pages
  for select to anon, authenticated
  using (enabled = true and tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- nav_items (solo habilitados)
alter table public.nav_items enable row level security;
drop policy if exists nav_items_public_read on public.nav_items;
drop policy if exists nav_items_tenant_read on public.nav_items;
create policy nav_items_tenant_read on public.nav_items
  for select to anon, authenticated
  using (enabled = true and tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- page_sections (solo habilitadas)
alter table public.page_sections enable row level security;
drop policy if exists page_sections_public_read on public.page_sections;
drop policy if exists page_sections_tenant_read on public.page_sections;
create policy page_sections_tenant_read on public.page_sections
  for select to anon, authenticated
  using (enabled = true and tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- section_items (solo habilitados)
alter table public.section_items enable row level security;
drop policy if exists section_items_public_read on public.section_items;
drop policy if exists section_items_tenant_read on public.section_items;
create policy section_items_tenant_read on public.section_items
  for select to anon, authenticated
  using (enabled = true and tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- blog_posts (solo publicados)
alter table public.blog_posts enable row level security;
drop policy if exists blog_posts_public_read on public.blog_posts;
drop policy if exists blog_posts_tenant_read on public.blog_posts;
create policy blog_posts_tenant_read on public.blog_posts
  for select to anon, authenticated
  using (published = true and tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- =============================================================================
-- Rollback (si el contenido se rompe en staging): restaurar las públicas amplias.
--   drop policy if exists pages_tenant_read on public.pages;
--   create policy pages_public_read on public.pages for select using (enabled = true);
--   ... (idem nav_items/page_sections/section_items; blog con published = true)
-- =============================================================================
