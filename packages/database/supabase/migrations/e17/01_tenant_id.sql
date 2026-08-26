-- =============================================================================
-- E17 · HU-156 — Introducción de tenant_id (paso 1: NO disruptivo)
-- =============================================================================
-- Añade `tenant_id` a las tablas tenant-scoped con DEFAULT = tenant por defecto,
-- de modo que la app single-tenant actual (que usa service-role y no envía
-- tenant_id) SIGUE FUNCIONANDO: filas existentes y nuevos inserts quedan
-- asignados al tenant por defecto automáticamente.
--
-- Este paso NO toca las políticas RLS ni convierte los singletons de config a
-- fila-por-tenant (eso viene DESPUÉS, junto con el cableado de @merkiai/tenancy).
--
-- Idempotente: seguro re-ejecutar (ADD COLUMN IF NOT EXISTS / CREATE INDEX IF NOT EXISTS).
-- Aplicar en el proyecto Supabase del PLANO DE TIENDA.
-- Nota: `tenant_id` NO lleva FK — el registro autoritativo de tenants vive en la
-- BD de PLATAFORMA (proyecto Supabase distinto); no hay FK entre proyectos.
-- =============================================================================

-- Tenant por defecto (debe coincidir con el seed de la BD de plataforma).
--   00000000-0000-0000-0000-000000000001

do $$
declare
  default_tenant constant uuid := '00000000-0000-0000-0000-000000000001';
  t text;
  -- Tablas tenant-scoped (datos de negocio del tenant).
  tenant_tables text[] := array[
    'categories','products','product_variants','variant_types',
    'orders','cart_items','customers','customer_addresses','profiles',
    'pages','page_sections','section_items','nav_items','media_assets',
    'blog_posts','coupons','newsletter_subscribers','themes','shipping_profiles'
  ];
  -- Config singleton (id = 1): se les añade tenant_id ya, pero se CONSERVA el
  -- CHECK (id = 1) por ahora; la conversión a fila-por-tenant es un paso posterior.
  config_tables text[] := array[
    'store_config','payment_config','shipping_config','admin_config'
  ];
begin
  -- 1) Tablas tenant-scoped: tenant_id NOT NULL con default → backfill automático.
  foreach t in array tenant_tables loop
    execute format(
      'alter table public.%I add column if not exists tenant_id uuid not null default %L',
      t, default_tenant
    );
    execute format(
      'create index if not exists %I on public.%I (tenant_id)',
      t || '_tenant_id_idx', t
    );
  end loop;

  -- 2) Config singleton: tenant_id NOT NULL con default (se mantiene id = 1 por ahora).
  foreach t in array config_tables loop
    execute format(
      'alter table public.%I add column if not exists tenant_id uuid not null default %L',
      t, default_tenant
    );
  end loop;

  -- 3) Idempotencia de webhooks: tenant_id NULLABLE (scoping/auditoría; PK sigue
  --    siendo (provider, event_id)).
  execute format(
    'alter table public.processed_webhook_events add column if not exists tenant_id uuid'
  );
end $$;

-- =============================================================================
-- PENDIENTE (pasos siguientes de HU-156, NO en este archivo):
--   a) Convertir singletons (store/payment/shipping/admin_config) a fila-por-tenant
--      (quitar CHECK id=1, clave por tenant_id) — tras cablear el tenant client.
--   b) Políticas RLS por tenant:  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
--      con WITH CHECK — reemplazando el acceso service-role del plano de tienda.
--   c) Cablear @merkiai/tenancy (createTenantClient) en los 66 usos TENANT.
-- Ver docs/HU-156-service-role-mapping.md y docs/adr/ADR-001-auth-rls-multitenant.md.
-- =============================================================================
