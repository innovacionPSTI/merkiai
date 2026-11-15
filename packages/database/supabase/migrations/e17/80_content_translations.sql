-- =============================================================================
-- E28 · HU-463 — Contenido traducible con fallback (ADR-011 §2.3)
-- =============================================================================
-- · Tablas de traducción por entidad con URL/búsqueda (producto, categoría,
--   entrada de blog, página): una fila por (entidad, locale), slug traducido
--   único por (tenant, locale). Locale = idioma base ('en') o regional ('es-MX').
-- · Bloques del Constructor: `translations` JSONB en page_sections y
--   section_items → { "<locale>": { "<campo>": "texto" } }. Los valores actuales
--   (columnas/settings) son el idioma por defecto: no se migran datos.
-- · orders.locale: idioma en que se hizo el pedido (correos por idioma, HU-465).
-- Sin traducciones, todo se ve exactamente igual. RLS por tenant. Plano de TIENDA.
-- Aditiva e idempotente.
-- =============================================================================

create table if not exists public.product_translations (
  id               bigint generated always as identity primary key,
  tenant_id        uuid not null,
  product_id       integer not null references public.products(id) on delete cascade,
  locale           text not null,
  name             text,
  description      text,
  seo_title        text,
  seo_desc         text,
  slug             text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (product_id, locale),
  constraint product_translations_locale_supported check (locale = any (array['es', 'en', 'es-CO', 'es-MX', 'es-ES', 'en-US']::text[])),
  constraint product_translations_slug_format check (slug is null or slug ~ '^[a-z0-9][a-z0-9-]*$')
);
-- Slug traducido único por tienda e idioma (resuelve /<locale>/…/<slug>).
create unique index if not exists product_translations_slug_uidx on public.product_translations (tenant_id, locale, slug) where slug is not null;
create index if not exists product_translations_entity_idx on public.product_translations (product_id);

alter table public.product_translations enable row level security;
drop policy if exists product_translations_tenant_read on public.product_translations;
create policy product_translations_tenant_read on public.product_translations
  for select to anon, authenticated
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
drop policy if exists product_translations_admin_all on public.product_translations;
create policy product_translations_admin_all on public.product_translations
  for all to authenticated
  using (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false))
  with check (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false));


create table if not exists public.category_translations (
  id               bigint generated always as identity primary key,
  tenant_id        uuid not null,
  category_id      integer not null references public.categories(id) on delete cascade,
  locale           text not null,
  name             text,
  description      text,
  meta_title       text,
  meta_description text,
  slug             text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (category_id, locale),
  constraint category_translations_locale_supported check (locale = any (array['es', 'en', 'es-CO', 'es-MX', 'es-ES', 'en-US']::text[])),
  constraint category_translations_slug_format check (slug is null or slug ~ '^[a-z0-9][a-z0-9-]*$')
);
-- Slug traducido único por tienda e idioma (resuelve /<locale>/…/<slug>).
create unique index if not exists category_translations_slug_uidx on public.category_translations (tenant_id, locale, slug) where slug is not null;
create index if not exists category_translations_entity_idx on public.category_translations (category_id);

alter table public.category_translations enable row level security;
drop policy if exists category_translations_tenant_read on public.category_translations;
create policy category_translations_tenant_read on public.category_translations
  for select to anon, authenticated
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
drop policy if exists category_translations_admin_all on public.category_translations;
create policy category_translations_admin_all on public.category_translations
  for all to authenticated
  using (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false))
  with check (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false));


create table if not exists public.blog_post_translations (
  id               bigint generated always as identity primary key,
  tenant_id        uuid not null,
  post_id          integer not null references public.blog_posts(id) on delete cascade,
  locale           text not null,
  title            text,
  excerpt          text,
  content          text,
  seo_title        text,
  seo_desc         text,
  slug             text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (post_id, locale),
  constraint blog_post_translations_locale_supported check (locale = any (array['es', 'en', 'es-CO', 'es-MX', 'es-ES', 'en-US']::text[])),
  constraint blog_post_translations_slug_format check (slug is null or slug ~ '^[a-z0-9][a-z0-9-]*$')
);
-- Slug traducido único por tienda e idioma (resuelve /<locale>/…/<slug>).
create unique index if not exists blog_post_translations_slug_uidx on public.blog_post_translations (tenant_id, locale, slug) where slug is not null;
create index if not exists blog_post_translations_entity_idx on public.blog_post_translations (post_id);

alter table public.blog_post_translations enable row level security;
drop policy if exists blog_post_translations_tenant_read on public.blog_post_translations;
create policy blog_post_translations_tenant_read on public.blog_post_translations
  for select to anon, authenticated
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
drop policy if exists blog_post_translations_admin_all on public.blog_post_translations;
create policy blog_post_translations_admin_all on public.blog_post_translations
  for all to authenticated
  using (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false))
  with check (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false));


create table if not exists public.page_translations (
  id               bigint generated always as identity primary key,
  tenant_id        uuid not null,
  page_key         text not null,
  locale           text not null,
  label            text,
  meta_title       text,
  meta_description text,
  slug             text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (tenant_id, page_key, locale),
  -- pages tiene PK compuesta (tenant_id, key) desde e17/04.
  foreign key (tenant_id, page_key) references public.pages (tenant_id, key) on delete cascade,
  constraint page_translations_locale_supported check (locale = any (array['es', 'en', 'es-CO', 'es-MX', 'es-ES', 'en-US']::text[])),
  constraint page_translations_slug_format check (slug is null or slug ~ '^[a-z0-9][a-z0-9-]*$')
);
-- Slug traducido único por tienda e idioma (resuelve /<locale>/…/<slug>).
create unique index if not exists page_translations_slug_uidx on public.page_translations (tenant_id, locale, slug) where slug is not null;
create index if not exists page_translations_entity_idx on public.page_translations (tenant_id, page_key);

alter table public.page_translations enable row level security;
drop policy if exists page_translations_tenant_read on public.page_translations;
create policy page_translations_tenant_read on public.page_translations
  for select to anon, authenticated
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
drop policy if exists page_translations_admin_all on public.page_translations;
create policy page_translations_admin_all on public.page_translations
  for all to authenticated
  using (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false))
  with check (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false));

-- ── Bloques del Constructor ────────────────────────────────────────────────────
alter table public.page_sections add column if not exists translations jsonb not null default '{}'::jsonb;
alter table public.section_items add column if not exists translations jsonb not null default '{}'::jsonb;

-- ── Idioma del pedido ─────────────────────────────────────────────────────────
alter table public.orders add column if not exists locale text;

-- Rollback (staging):
--   drop table if exists public.product_translations, public.category_translations,
--     public.blog_post_translations, public.page_translations;
--   alter table public.page_sections drop column if exists translations;
--   alter table public.section_items drop column if exists translations;
--   alter table public.orders drop column if exists locale;
