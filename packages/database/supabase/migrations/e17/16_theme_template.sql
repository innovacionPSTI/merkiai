-- =============================================================================
-- E17 · HU-121 — Unificar Tema + Template en una sola "Plantilla"
-- =============================================================================
-- Hasta ahora el comerciante elegía por separado la PALETA (tabla `themes`) y el
-- LAYOUT del home (`store_config.template`). HU-121 los une: cada tema pasa a ser
-- una "Plantilla" que lleva también su layout, en la nueva columna
-- `themes.template`. El storefront resuelve el layout efectivo así:
--     theme.template (plantilla activa)  →  store_config.template (legacy)  →  'default'
-- `themes.template` nullable: NULL = hereda el de store_config (retrocompat; los
-- temas existentes no cambian de conducta). store_config.template se conserva
-- como fallback y para tiendas sin tema activo.
-- Idempotente. Aplicar en el proyecto Supabase de admin/web (plano de tienda).
-- =============================================================================

alter table public.themes
  add column if not exists template text;
