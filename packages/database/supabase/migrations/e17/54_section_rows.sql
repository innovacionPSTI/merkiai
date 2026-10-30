-- =============================================================================
-- E17 · HU-351 — Capa de layout: Filas/Columnas en page_sections
-- =============================================================================
-- Metadato de ubicación OPT-IN para agrupar secciones en filas de columnas:
--   · row_id      — a qué fila pertenece el bloque (NULL = fila propia full-width)
--   · row_layout  — preset de proporciones de la fila ("6,6", "8,4", "4,4,4"…)
--   · col_index   — posición de la celda dentro de la fila
-- Aditivo y nullable: una sección sin row_id renderiza idéntico a hoy (pila
-- vertical) → CERO regresión. Idempotente. Aplicar en el PLANO DE TIENDA.
-- =============================================================================

alter table public.page_sections add column if not exists row_id     text;
alter table public.page_sections add column if not exists row_layout text;
alter table public.page_sections add column if not exists col_index  int;
