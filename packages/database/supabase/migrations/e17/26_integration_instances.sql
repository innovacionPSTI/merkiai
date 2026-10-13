-- =============================================================================
-- E17 · ADR-004 (HU-275) — Instancias de integración (multi-config por proveedor)
-- =============================================================================
-- Reemplaza, a futuro, las columnas fijas de payment_config/shipping_config/…
-- por filas: cada fila es UNA configuración concreta de un proveedor (pasarela,
-- transportadora, correo). Permite varias del mismo proveedor (p. ej. Wompi
-- Pruebas + Wompi Producción) con etiqueta interna, conservando "una activa a la
-- vez" por (tenant, kind).
--
-- Secretos: la columna `credentials` (jsonb) guarda llaves/tokens. Por eso RLS
-- NO expone política anon/pública; solo el JWT con is_admin (panel/máquina) de
-- SU tenant puede leer/escribir (igual que payment_config).
--
-- Esta migración SOLO crea la estructura; nadie la lee aún (el checkout sigue en
-- payment_config). El backfill y el cambio del camino de lectura van en HU-277.
-- Idempotente. Aplicar en el Supabase del PLANO DE TIENDA.
-- =============================================================================

create table if not exists public.integration_instances (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null,
  kind        text not null check (kind in ('payment','shipping','email')),
  provider    text not null,
  label       text,                               -- etiqueta INTERNA (admin)
  environment text not null default 'test' check (environment in ('test','production')),
  credentials jsonb not null default '{}'::jsonb,  -- secretos (no se exponen a anon)
  settings    jsonb not null default '{}'::jsonb,  -- config no sensible (p. ej. métodos TuCompra)
  enabled     boolean not null default true,
  is_active   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Una sola instancia ACTIVA por (tenant, kind) → "single-active" conservado.
create unique index if not exists integration_instances_active_uk
  on public.integration_instances (tenant_id, kind) where is_active;

-- Listado por tenant+kind (pantallas de Pagos/Envíos/Correo).
create index if not exists integration_instances_tenant_kind_idx
  on public.integration_instances (tenant_id, kind);

-- RLS: secretos → sin política anon. Solo is_admin (panel/máquina) de SU tenant.
alter table public.integration_instances enable row level security;
drop policy if exists integration_instances_admin_all on public.integration_instances;
create policy integration_instances_admin_all on public.integration_instances
  for all to authenticated
  using      (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false))
  with check (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false));

-- updated_at automático
create or replace function public.touch_integration_instances() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;
drop trigger if exists trg_touch_integration_instances on public.integration_instances;
create trigger trg_touch_integration_instances
  before update on public.integration_instances
  for each row execute function public.touch_integration_instances();

-- =============================================================================
-- Rollback:
--   drop trigger if exists trg_touch_integration_instances on public.integration_instances;
--   drop function if exists public.touch_integration_instances();
--   drop table if exists public.integration_instances;   -- (cascade si aplica)
-- =============================================================================
