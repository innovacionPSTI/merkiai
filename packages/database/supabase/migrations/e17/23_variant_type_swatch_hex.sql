-- =============================================================================
-- E17 · HU-264 — Swatches de color desde datos
-- =============================================================================
-- `swatch_hex` es un mapa valor→hex para los tipos de variante de color
-- (display_type = 'swatch'), p. ej. {"Rojo":"#e11","Azul":"#1e40af"}. Reemplaza
-- el diccionario fijo `COLOR_HEX` del storefront: cada tienda define sus colores.
-- El storefront fusiona los mapas de todos los tipos y cae a COLOR_HEX / al valor
-- crudo si no hay hex. NULL/{} = usa el fallback.
-- Idempotente. Aplicar en el proyecto Supabase de admin/web (plano de tienda).
-- =============================================================================

alter table public.variant_types
  add column if not exists swatch_hex jsonb not null default '{}';
