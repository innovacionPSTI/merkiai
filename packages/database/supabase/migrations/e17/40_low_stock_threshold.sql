-- =============================================================================
-- E17 · HU-106 — Umbral de stock bajo (alertas de inventario)
-- =============================================================================
-- Umbral global por tienda: una variante activa (sin backorder) con stock <=
-- umbral se considera "stock bajo" y se marca en el dashboard / listado.
-- Idempotente. Aplicar en el proyecto Supabase del PLANO DE TIENDA.
-- =============================================================================

alter table public.store_config
  add column if not exists low_stock_threshold int not null default 5;
