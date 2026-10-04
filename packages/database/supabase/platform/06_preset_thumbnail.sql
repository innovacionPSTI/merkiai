-- =============================================================================
-- Plataforma · presets.thumbnail_url  (HU-257 — Miniaturas de la galería)
-- =============================================================================
-- URL de la imagen curada que representa el preset en la galería de plantillas
-- del admin (HU-250). NULL = la galería muestra un placeholder determinista por
-- nicho. Lo cura el operador desde la consola (CRUD de presets, HU-233).
-- Idempotente. Aplicar en el proyecto Supabase de PLATAFORMA.
-- =============================================================================

alter table public.presets
  add column if not exists thumbnail_url text;
