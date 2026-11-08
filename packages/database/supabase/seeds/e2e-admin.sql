-- =============================================================================
-- e2e-admin.sql — Perfil del ADMIN DE PRUEBA en la BD de TIENDA (plano de tienda).
-- -----------------------------------------------------------------------------
-- Crea/actualiza (idempotente) la fila `profiles` que liga el email del usuario
-- de Stack Auth con el tenant de prueba y le da rol `super_admin` (acceso total
-- al panel). La IDENTIDAD/clave (email+contraseña) la gestiona Stack Auth; esta
-- fila solo es el enlace email → tenant + rol para el gating del admin.
--
-- Parámetros (psql -v):
--   tenant_id    → id del tenant de prueba (debe existir en la plataforma)
--   admin_email  → email del usuario admin de prueba (el mismo de Stack Auth)
--
-- Uso:
--   psql "$DATABASE_URL" -v tenant_id="'…'" -v admin_email="'e2e-admin@…'" \
--        -f packages/database/supabase/seeds/e2e-admin.sql
--
-- Requiere migraciones aplicadas (incl. e17/01 tenant_id y e17/03 unique por tenant).
-- NUNCA aplicar en producción.
-- =============================================================================
\set ON_ERROR_STOP on

insert into public.profiles (id, email, full_name, role, tenant_id, created_at)
values (gen_random_uuid(), lower(:admin_email), 'Admin E2E', 'super_admin', :tenant_id, now())
on conflict (tenant_id, email) do update
  set role = 'super_admin';

\echo '✓ Tienda: perfil admin de prueba (super_admin) listo.'
