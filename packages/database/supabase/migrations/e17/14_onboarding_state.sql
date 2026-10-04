-- =============================================================================
-- E17 · HU-236 v2 — Estado de onboarding reanudable (por tienda)
-- =============================================================================
-- `store_config.onboarding_state` guarda el progreso del wizard de onboarding
-- del admin para que el comerciante pueda salir y retomar donde lo dejó:
--   { "presetApplied": <key|null>, "appliedAt": <iso|null>,
--     "dismissed": <bool>, "completedAt": <iso|null> }
-- Es estado del PLANO DE TIENDA (no de plataforma): cada tenant lleva el suyo,
-- no se mezcla con el catálogo de presets (plataforma). NULL = onboarding sin
-- empezar. El checklist "duro" (productos, tema, dominio, envíos) NO se guarda
-- aquí: se deriva en vivo de los datos reales de la tienda.
-- Idempotente. Aplicar en el proyecto Supabase de admin/web (plano de tienda).
-- =============================================================================

alter table public.store_config
  add column if not exists onboarding_state jsonb;
