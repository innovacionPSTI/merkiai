-- =============================================================================
-- E17 · HU-405 — Órdenes de producción (transformación: consumo → terminado)
-- =============================================================================
-- Registra la transformación de insumos en producto terminado (caso `al_producir`
-- de la receta/BOM, HU-404): al **completar** una orden se descuentan los
-- componentes (movimientos de salida) y se **crea stock** del terminado (movimiento
-- de entrada) con su **costo** (del lote), y se registra la **merma/rendimiento**
-- (planificado vs. obtenido). Todo sobre el libro de movimientos (HU-401).
--
-- Multi-tenant + RLS admin-only. Aditiva e idempotente. Plano de TIENDA.
-- =============================================================================

create table if not exists public.production_orders (
  id                   bigint generated always as identity primary key,
  tenant_id            uuid not null,
  output_stock_item_id bigint not null references public.stock_items(id) on delete restrict,
  bom_id               bigint references public.boms(id) on delete set null,
  location_id          bigint,                               -- E18-ready
  planned_qty          numeric not null check (planned_qty > 0),
  produced_qty         numeric check (produced_qty >= 0),    -- se fija al completar
  status               text not null default 'draft'
                         check (status in ('draft','completed','cancelled')),
  notes                text,
  completed_at         timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (tenant_id, id)
);

create index if not exists production_orders_output_idx
  on public.production_orders (tenant_id, output_stock_item_id, status);

-- ── RLS (admin-only) ──────────────────────────────────────────────────────────
alter table public.production_orders enable row level security;

drop policy if exists production_orders_admin_all on public.production_orders;
create policy production_orders_admin_all on public.production_orders
  for all to authenticated
  using (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false))
  with check (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false));

-- =============================================================================
-- Rollback (staging):
--   drop table if exists public.production_orders;
-- =============================================================================
