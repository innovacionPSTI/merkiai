-- =============================================================================
-- E17 · HU-404 — Receta / Lista de materiales (BOM) con política de consumo
-- =============================================================================
-- Define de qué se compone un ítem de salida y **cuándo** se descuentan sus
-- componentes. Unifica "elaboración al momento" y "producción a inventario" con
-- un solo toggle `consumption_policy`:
--   · al_vender    → el producto no stockea; vender descuenta componentes
--                    (caso de los bundles/combos existentes, HU-168).
--   · al_producir  → una orden de producción (HU-405) descuenta componentes y
--                    crea stock del terminado (café/manufactura).
--
-- Los componentes son cualquier `stock_item` (incl. empaques/insumos). `yield_qty`
-- es cuántas unidades de salida produce la receta. Multi-tenant + RLS admin-only.
-- Aditiva e idempotente. Plano de TIENDA.
-- =============================================================================

create table if not exists public.boms (
  id                   bigint generated always as identity primary key,
  tenant_id            uuid not null,
  output_stock_item_id bigint not null references public.stock_items(id) on delete cascade,
  name                 text,
  consumption_policy   text not null default 'al_vender'
                         check (consumption_policy in ('al_vender','al_producir')),
  yield_qty            numeric not null default 1 check (yield_qty > 0),
  active               boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (tenant_id, id)
);

create index if not exists boms_output_idx
  on public.boms (tenant_id, output_stock_item_id);

create table if not exists public.bom_components (
  id                     bigint generated always as identity primary key,
  tenant_id              uuid not null,
  bom_id                 bigint not null references public.boms(id) on delete cascade,
  component_stock_item_id bigint not null references public.stock_items(id) on delete restrict,
  qty                    numeric not null check (qty > 0),   -- en la unidad `uom_id`
  uom_id                 bigint references public.uoms(id) on delete set null,
  created_at             timestamptz not null default now()
);

create index if not exists bom_components_bom_idx
  on public.bom_components (tenant_id, bom_id);

-- ── RLS (admin-only) ──────────────────────────────────────────────────────────
alter table public.boms           enable row level security;
alter table public.bom_components enable row level security;

drop policy if exists boms_admin_all on public.boms;
create policy boms_admin_all on public.boms
  for all to authenticated
  using (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false))
  with check (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false));

drop policy if exists bom_components_admin_all on public.bom_components;
create policy bom_components_admin_all on public.bom_components
  for all to authenticated
  using (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false))
  with check (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false));

-- =============================================================================
-- Rollback (staging):
--   drop table if exists public.bom_components;
--   drop table if exists public.boms;
-- =============================================================================
