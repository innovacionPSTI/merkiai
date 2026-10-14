-- =============================================================================
-- E17 · HU-102 — Índice de texto para búsqueda de productos
-- =============================================================================
-- El buscador (autocompletado + resultados) usa `name ILIKE %q%` / `description
-- ILIKE %q%`. Sin índice, cada búsqueda hace seq scan. Con pg_trgm + GIN, los
-- ILIKE con comodín por ambos lados usan índice → respuesta rápida en catálogos
-- grandes. No cambia el comportamiento, solo el rendimiento.
-- Idempotente. Aplicar en el proyecto Supabase del PLANO DE TIENDA.
-- =============================================================================

create extension if not exists pg_trgm;

create index if not exists products_name_trgm_idx
  on public.products using gin (name gin_trgm_ops);

create index if not exists products_description_trgm_idx
  on public.products using gin (description gin_trgm_ops);
