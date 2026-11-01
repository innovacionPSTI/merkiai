-- =============================================================================
-- PLATAFORMA · HU-373 — "Blueprint de sitio" en los presets
-- =============================================================================
-- Un preset puede llevar ahora una ESTRUCTURA DE SITIO (blueprint): páginas +
-- navegación + regiones de chrome. Se guarda como JSON en una columna nueva y lo
-- materializa `seedBlueprint` (packages/database) al aplicar el preset, solo si
-- el plan del tenant habilita la feature `site_blueprints` (resuelto por el
-- control plane). Aditiva e idempotente; default '{}' = sin blueprint → cero
-- regresión para los presets existentes.
--
-- Aplicar en el proyecto Supabase de PLATAFORMA (control plane).
-- =============================================================================

alter table public.presets
  add column if not exists blueprint jsonb not null default '{}'::jsonb;

comment on column public.presets.blueprint is
  'HU-373 · estructura de sitio opcional (pages/nav/regions) materializada por seedBlueprint al aplicar el preset, gated por site_blueprints.';
