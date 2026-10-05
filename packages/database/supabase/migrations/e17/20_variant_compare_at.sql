-- =============================================================================
-- E17 · HU-261 — Precio comparativo / oferta por variante
-- =============================================================================
-- `compare_at_price` (centavos) es el precio ANTES de la oferta. Si está y es
-- mayor que `price`, el storefront muestra el precio tachado + el actual con el
-- color de precio (--brand-price, HU-247). NULL = sin oferta.
-- Idempotente. Aplicar en el proyecto Supabase de admin/web (plano de tienda).
-- =============================================================================

alter table public.product_variants
  add column if not exists compare_at_price integer;
