-- =============================================================================
-- E17 · HU-262 — Imagen por variante
-- =============================================================================
-- `image_url` permite que una variante (p. ej. un color) tenga su propia imagen.
-- En la PDP, al seleccionar la variante, la galería muestra esa imagen. NULL =
-- usa las imágenes del producto.
-- Idempotente. Aplicar en el proyecto Supabase de admin/web (plano de tienda).
-- =============================================================================

alter table public.product_variants
  add column if not exists image_url text;
