-- =============================================================================
-- E17 · HU-401 — Libro de movimientos de inventario (`stock_movements`)
-- =============================================================================
-- La **espina dorsal** del inventario (E24): una tabla **append-only** donde cada
-- fila es una entrada o salida **tipificada**, con cantidad, unidad, ubicación
-- (preparada para E18), motivo y una **referencia opcional** (pedido, producción,
-- compra, cliente, factura externa). El **disponible** es una **proyección** de
-- este libro (vista `stock_item_available`), no un contador editado a mano.
--
-- Esta migración es **aditiva y paralela**: NO cambia el descuento de stock actual
-- (HU-098, por variante). La migración del descuento implícito al libro va con
-- E18 · HU-178 (cutover coordinado). Multi-tenant + RLS admin-only.
--
-- Aplicar en el PLANO DE TIENDA. Idempotente.
-- =============================================================================

create table if not exists public.stock_movements (
  id             bigint generated always as identity primary key,
  tenant_id      uuid not null,
  stock_item_id  bigint not null references public.stock_items(id) on delete restrict,
  location_id    bigint,                                   -- E18-ready (nullable por ahora)
  movement_type  text not null
                   check (movement_type in (
                     'purchase','production_consume','production_output',
                     'sale','waste','adjustment','transfer','sample','return')),
  direction      text not null check (direction in ('in','out')),
  qty            numeric not null check (qty > 0),         -- cantidad ingresada (positiva)
  uom_id         bigint references public.uoms(id) on delete set null,
  qty_base       numeric not null,                         -- cantidad en unidad base, CON SIGNO (+in/-out)
  reason         text,
  ref_type       text,                                     -- 'order' | 'production' | 'purchase' | 'customer' | 'invoice' | …
  ref_id         text,
  op_key         text,                                     -- clave de idempotencia (opcional)
  created_by     text,
  created_at     timestamptz not null default now()
);

create index if not exists stock_movements_item_idx
  on public.stock_movements (tenant_id, stock_item_id, created_at);
create index if not exists stock_movements_ref_idx
  on public.stock_movements (tenant_id, ref_type, ref_id);
-- Idempotencia: a lo sumo un movimiento por (tenant, op_key) cuando se provee.
create unique index if not exists stock_movements_opkey_uidx
  on public.stock_movements (tenant_id, op_key) where op_key is not null;

-- ── Proyección de disponible: suma de qty_base por (ítem, ubicación) ──────────
create or replace view public.stock_item_available as
  select tenant_id, stock_item_id, location_id, sum(qty_base) as available
    from public.stock_movements
   group by tenant_id, stock_item_id, location_id;

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table public.stock_movements enable row level security;

-- Datos internos de operación (no storefront). Lectura/escritura del panel
-- (is_admin) sobre SU tenant; el service-role (SSR/máquina) omite RLS. El libro
-- es append-only por diseño (la app no actualiza ni borra; las correcciones son
-- movimientos de ajuste).
drop policy if exists stock_movements_admin_rw on public.stock_movements;
create policy stock_movements_admin_rw on public.stock_movements
  for all to authenticated
  using (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false))
  with check (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false));

-- =============================================================================
-- Rollback (staging):
--   drop view if exists public.stock_item_available;
--   drop table if exists public.stock_movements;
-- =============================================================================
