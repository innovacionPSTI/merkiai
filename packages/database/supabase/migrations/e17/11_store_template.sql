-- =============================================================================
-- E17 · HU-217 — Selector de Template por tienda
-- =============================================================================
-- `store_config.template` selecciona el preset de presentación del storefront
-- (disposición de bloques + variantes). Hoy solo existe 'default'; el seam queda
-- listo para agregar templates sin tocar el código de rutas.
-- Idempotente. Aplicar en el proyecto Supabase de admin/web.
-- =============================================================================

alter table public.store_config
  add column if not exists template text not null default 'default';
