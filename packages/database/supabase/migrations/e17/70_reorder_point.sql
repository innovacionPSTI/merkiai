-- =============================================================================
-- E17 · HU-409 (Fase 2a) — Punto de reorden por ítem de inventario
-- =============================================================================
-- Umbral de "bajo mínimo" por ítem del ledger (generaliza el `low_stock_threshold`
-- único de HU-106, que vive sobre `product_variants.stock`). Nullable: sin valor,
-- el ítem no genera alerta (cero regresión). Aditiva e idempotente. Plano TIENDA.
-- =============================================================================

alter table public.stock_items
  add column if not exists reorder_point numeric
    check (reorder_point is null or reorder_point >= 0);

comment on column public.stock_items.reorder_point is
  'HU-409 · punto de reorden (en unidad base). Si disponible <= reorder_point se alerta. NULL = sin alerta.';

-- =============================================================================
-- Rollback (staging):
--   alter table public.stock_items drop column if exists reorder_point;
-- =============================================================================
