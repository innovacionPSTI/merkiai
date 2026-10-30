-- =============================================================================
-- E17 · HU-352 — Estilo por página (overrides sobre el tema)
-- =============================================================================
-- Overrides OPT-IN por página en cascada sobre el tema global (HU-247):
--   style JSONB = { accent?: "#RRGGBB", container?: "...", space?: "..." }
-- Sin override (NULL) la página hereda el tema → CERO regresión. El acento
-- re-tinta las CSS vars (--brand-primary/--brand-dark) solo en esa página.
-- Idempotente. Aplicar en el PLANO DE TIENDA.
-- =============================================================================

alter table public.pages add column if not exists style jsonb;
