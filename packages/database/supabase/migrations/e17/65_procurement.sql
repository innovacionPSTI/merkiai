-- =============================================================================
-- E17 · HU-402 — Compras / aprovisionamiento (proveedores + compras)
-- =============================================================================
-- Registrar compras y recibir mercancía: aumenta existencias (entradas al libro
-- de movimientos, HU-401) y **alimenta el costo** (unit_cost por unidad base en
-- el movimiento, base del costeo HU-403). Sin cuentas por pagar contables (la
-- frontera anti-ERP: lo contable va por integración).
--
-- Tablas: suppliers, purchases (cabecera), purchase_items (líneas). Multi-tenant
-- + RLS admin-only. Además añade `stock_movements.unit_cost` (costo por unidad
-- base, nullable) para el costeo. Aditiva e idempotente. Plano de TIENDA.
-- =============================================================================

create table if not exists public.suppliers (
  id          bigint generated always as identity primary key,
  tenant_id   uuid not null,
  name        text not null,
  email       text,
  phone       text,
  notes       text,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (tenant_id, id)
);

create table if not exists public.purchases (
  id           bigint generated always as identity primary key,
  tenant_id    uuid not null,
  supplier_id  bigint references public.suppliers(id) on delete set null,
  location_id  bigint,                                  -- E18-ready
  reference    text,                                    -- nº de factura/remisión del proveedor
  status       text not null default 'draft'
                 check (status in ('draft','received','cancelled')),
  notes        text,
  received_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (tenant_id, id)
);

create table if not exists public.purchase_items (
  id            bigint generated always as identity primary key,
  tenant_id     uuid not null,
  purchase_id   bigint not null references public.purchases(id) on delete cascade,
  stock_item_id bigint not null references public.stock_items(id) on delete restrict,
  qty           numeric not null check (qty > 0),        -- en la unidad `uom_id`
  uom_id        bigint references public.uoms(id) on delete set null,
  unit_cost     numeric not null default 0 check (unit_cost >= 0), -- costo por unidad `uom_id`
  created_at    timestamptz not null default now()
);

create index if not exists purchase_items_purchase_idx
  on public.purchase_items (tenant_id, purchase_id);

-- Costo por unidad base en el libro (para costeo HU-403). Nullable: solo aplica
-- a entradas con costo conocido (compra / producción).
alter table public.stock_movements
  add column if not exists unit_cost numeric;

-- ── RLS (admin-only; datos internos de operación) ─────────────────────────────
alter table public.suppliers      enable row level security;
alter table public.purchases      enable row level security;
alter table public.purchase_items enable row level security;

drop policy if exists suppliers_admin_all on public.suppliers;
create policy suppliers_admin_all on public.suppliers
  for all to authenticated
  using (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false))
  with check (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false));

drop policy if exists purchases_admin_all on public.purchases;
create policy purchases_admin_all on public.purchases
  for all to authenticated
  using (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false))
  with check (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false));

drop policy if exists purchase_items_admin_all on public.purchase_items;
create policy purchase_items_admin_all on public.purchase_items
  for all to authenticated
  using (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false))
  with check (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false));

-- =============================================================================
-- Rollback (staging):
--   alter table public.stock_movements drop column if exists unit_cost;
--   drop table if exists public.purchase_items;
--   drop table if exists public.purchases;
--   drop table if exists public.suppliers;
-- =============================================================================
