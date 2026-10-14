-- =============================================================================
-- E17 · Ola PDP (HU-285/286/287) — flags por tienda de la página de producto
-- =============================================================================
-- Tres toggles por tenant en store_config, para que cada tienda "vista" su PDP
-- sin tocar código. Defaults seguros: el estimador de envío NACE apagado
-- (el comerciante decide si expone costos antes del checkout); recomendaciones
-- y compartir nacen encendidos (sin PII, de bajo riesgo).
-- Idempotente. Aplicar en el proyecto Supabase de admin/web (plano de tienda).
-- =============================================================================

alter table public.store_config
  add column if not exists pdp_shipping_estimator boolean not null default false,
  add column if not exists pdp_recommendations     boolean not null default true,
  add column if not exists pdp_share_enabled        boolean not null default true;
