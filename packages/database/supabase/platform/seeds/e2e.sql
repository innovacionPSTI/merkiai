-- =============================================================================
-- e2e.sql — Provisioning del TENANT DE PRUEBA en la BD de PLATAFORMA (control plane).
-- -----------------------------------------------------------------------------
-- Crea/actualiza (idempotente):
--   1. un plan `e2e` con TODAS las features activas y límites generosos, para que
--      las specs que dependen de inventory/quotes/price_lists/multi_location/… no
--      se salten por 402;
--   2. el tenant de prueba apuntando a ese plan y en estado `active`.
--
-- Parámetros (psql -v):
--   tenant_id   → id del tenant de prueba (default: tenant de migración 0000…0001)
--   subdomain   → subdominio de plataforma del tenant de prueba (default: 'e2e')
--
-- Uso:
--   psql "$PLATFORM_DATABASE_URL" -v tenant_id="'…'" -v subdomain="'e2e'" \
--        -f packages/database/supabase/platform/seeds/e2e.sql
--
-- Requiere el schema de plataforma aplicado (01_platform_schema + 03_plans).
-- NUNCA aplicar en producción.
-- =============================================================================
\set ON_ERROR_STOP on

-- Plan de pruebas: todo habilitado. Las claves coinciden con el catálogo canónico
-- de @merkiai/tenancy (FEATURES). Límites altos para no toparse en E2E.
insert into public.plans (key, name, price_cents, features, limits, data_isolation, active)
values (
  'e2e', 'E2E (pruebas)', 0,
  jsonb_build_object(
    'custom_domain', true, 'multi_location', true, 'ai_design', true,
    'page_builder', true, 'ecommerce', true, 'inventory', true,
    'price_lists', true, 'quotes', true, 'vip_early_access', true,
    'layout_avanzado', true, 'estilo_por_pagina', true, 'colecciones', true,
    'plantillas_por_tipo', true, 'listado_dinamico', true, 'partials_globales', true,
    'biblioteca_medios', true, 'bloques_guardados', true, 'content_mode', true,
    'editable_chrome', true, 'site_blueprints', true
  ),
  jsonb_build_object(
    'products', 100000, 'users', 1000, 'categories', 10000, 'orders_month', 1000000,
    'ai_generations_month', 100000, 'max_paginas', 10000, 'max_colecciones', 10000,
    'max_registros_coleccion', 1000000, 'max_medios_mb', 100000, 'max_niveles_nav', 10
  ),
  'shared', true
)
on conflict (key) do update
  set features = excluded.features,
      limits   = excluded.limits,
      name     = excluded.name,
      active   = true;

-- Tenant de prueba → plan e2e, activo. Si ya existe (p. ej. el tenant de
-- migración 0000…0001), solo se le fija el plan y el estado.
insert into public.tenants (id, stack_team_id, name, subdomain, status, plan, data_isolation, db_ref)
values (:tenant_id, null, 'Tienda E2E', :subdomain, 'active', 'e2e', 'shared', null)
on conflict (id) do update
  set plan   = 'e2e',
      status = 'active',
      name   = coalesce(public.tenants.name, 'Tienda E2E');

\echo '✓ Plataforma: plan e2e + tenant de prueba listos.'
