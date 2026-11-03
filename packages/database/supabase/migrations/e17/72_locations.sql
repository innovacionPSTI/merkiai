-- =============================================================================
-- E18 · HU-176 — Modelo de ubicaciones (`locations`)
-- =============================================================================
-- Ubicaciones del negocio (bodegas, tiendas físicas, puntos de retiro). Son la
-- **dimensión de ubicación del ledger** (E24): `stock_movements.location_id` —
-- hasta hoy un placeholder nullable — pasa a referenciar esta tabla, y el
-- disponible por `(ítem, ubicación)` es proyección del libro (vista existente
-- `stock_item_available`). Gated por la feature `multi_location`.
--
-- Multi-tenant + RLS admin_all + lectura pública acotada (puntos de retiro en el
-- storefront). Aditiva e idempotente. Plano de TIENDA.
-- =============================================================================

create table if not exists public.locations (
  id          bigint generated always as identity primary key,
  tenant_id   uuid not null,
  code        text not null,
  name        text not null,
  kind        text not null default 'warehouse'
    check (kind in ('warehouse', 'store', 'pickup')),
  address     text,
  city        text,
  department  text,
  is_default  boolean not null default false,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (tenant_id, code)
);

-- Una sola ubicación por defecto por tenant.
create unique index if not exists locations_one_default_idx
  on public.locations (tenant_id) where is_default;

create index if not exists locations_tenant_active_idx
  on public.locations (tenant_id, active);

-- La dimensión de ubicación del ledger referencia esta tabla (nullable → una sola
-- ubicación/tenant-por-defecto sigue funcionando sin fijarla).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'stock_movements_location_fk'
  ) then
    alter table public.stock_movements
      add constraint stock_movements_location_fk
      foreign key (location_id) references public.locations(id) on delete set null;
  end if;
end $$;

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table public.locations enable row level security;

-- Lectura pública acotada por tenant: puntos de retiro/tiendas activos (storefront).
drop policy if exists locations_tenant_read on public.locations;
create policy locations_tenant_read on public.locations
  for select to anon, authenticated
  using (active = true and tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

drop policy if exists locations_admin_all on public.locations;
create policy locations_admin_all on public.locations
  for all to authenticated
  using (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false))
  with check (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false));

-- =============================================================================
-- Rollback (staging):
--   alter table public.stock_movements drop constraint if exists stock_movements_location_fk;
--   drop table if exists public.locations;
-- =============================================================================
