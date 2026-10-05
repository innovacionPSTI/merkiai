-- =============================================================================
-- E17 · HU-260 — Generalizar el catálogo: quitar legacy de café
-- =============================================================================
-- El sistema genérico de variantes (products.variant_options +
-- product_variants.attributes {Color:Rojo, Talla:M}) reemplaza por completo a
-- las columnas específicas de café. Se eliminan `roast`, `grind`, `brew_method`
-- (sin uso funcional) y se libera `weight` de su CHECK fijo (250g/500g/1kg) para
-- que sea una etiqueta libre (solo queda como fallback de envío; el peso real
-- vive en `weight_kg`). Así el catálogo —y el futuro import CSV (HU-124)— no
-- arrastran un nicho concreto.
-- Idempotente. Aplicar en el proyecto Supabase de admin/web (plano de tienda).
-- =============================================================================

alter table public.product_variants
  drop column if exists roast,
  drop column if exists grind,
  drop column if exists brew_method;

-- `weight` deja de estar restringido a valores de café (sigue siendo opcional).
alter table public.product_variants
  drop constraint if exists product_variants_weight_check;
