-- =============================================================================
-- E17 · HU-207/232 — Config: PK por tenant (una fila por tenant, sin colisión)
-- =============================================================================
-- Las tablas de config (store/payment/shipping/admin_config) nacieron como
-- SINGLETONS: `id INTEGER PRIMARY KEY DEFAULT 1`. e17/07 les añadió
-- `unique(tenant_id)` + RLS, pero el PK siguió siendo `id` con default 1 →
-- insertar la config de un tenant NUEVO intenta `id=1` y **colisiona con el PK
-- del tenant por defecto** (que ya tiene id=1). Resultado: el seed (HU-207) y el
-- guardado desde el admin fallaban para cualquier tenant que no fuera el default.
--
-- Fix: el PK pasa a ser `tenant_id` (estas tablas son una-fila-por-tenant). La
-- columna `id` se conserva (ya no es PK; su default 1 es inofensivo). El índice
-- único `*_tenant_uk` de e17/07 queda redundante con el PK → se elimina.
--
-- Idempotente. Aplicar en el proyecto Supabase del PLANO DE TIENDA.
-- Requiere e17/01 (tenant_id) y e17/07 (unique + RLS) aplicados.
-- =============================================================================

do $$
declare
  t text;
  cfg text[] := array['store_config','payment_config','shipping_config','admin_config'];
begin
  foreach t in array cfg loop
    -- 0) Quitar el CHECK singleton `id = 1` si quedó (shipping_config lo conserva:
    --    e17/03 intentó borrar un índice `_singleton_idx` inexistente, no la
    --    CONSTRAINT `_singleton`). Con `id` SERIAL, el tenant nuevo recibe id=2 y
    --    violaba el CHECK → su config no se creaba. Idempotente para los 4.
    execute format('alter table public.%I drop constraint if exists %I', t, t || '_singleton');

    -- 1) Quitar el PK actual (sobre `id`), sea cual sea su nombre por defecto.
    execute format('alter table public.%I drop constraint if exists %I', t, t || '_pkey');

    -- 2) Quitar el UNIQUE por tenant redundante. Según qué migración lo creó puede
    --    ser una CONSTRAINT (e17/03 · add constraint) o un ÍNDICE suelto (e17/07 ·
    --    create unique index). Se intentan ambos con IF EXISTS (idempotente).
    execute format('alter table public.%I drop constraint if exists %I', t, t || '_tenant_uk');
    execute format('drop index if exists public.%I', t || '_tenant_uk');

    -- 3) PK sobre tenant_id (una fila por tenant). tenant_id ya es NOT NULL (e17/01).
    if not exists (select 1 from pg_constraint where conname = t || '_tenant_pk') then
      execute format('alter table public.%I add constraint %I primary key (tenant_id)', t, t || '_tenant_pk');
    end if;
  end loop;
end $$;

-- Verificación (correr tras aplicar):
--   select conname, contype from pg_constraint
--     where conrelid = 'public.store_config'::regclass;  -- debe listar store_config_tenant_pk (p)
