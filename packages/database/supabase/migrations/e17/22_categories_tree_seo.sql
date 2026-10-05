-- =============================================================================
-- E17 · HU-263 — Categorías con jerarquía + SEO
-- =============================================================================
-- `parent_id` permite subcategorías (self-FK; NULL = categoría raíz). Al borrar
-- la madre, las hijas quedan a nivel raíz (SET NULL). `meta_title`/
-- `meta_description` dan SEO por categoría, en paridad con pages/products.
-- Idempotente. Aplicar en el proyecto Supabase de admin/web (plano de tienda).
-- =============================================================================

alter table public.categories
  add column if not exists parent_id       integer references public.categories(id) on delete set null,
  add column if not exists meta_title       text,
  add column if not exists meta_description text;

create index if not exists categories_parent_idx on public.categories (parent_id);
