-- =============================================================================
-- E18 · HU-180 (AC-3) — Estados de transferencia entre ubicaciones
-- =============================================================================
-- Da **ciclo de vida** a las transferencias (antes inmediatas): al **despachar**
-- sale el stock del origen (`transfer` out, estado `in_transit`); al **recibir**
-- entra en el destino (`transfer` in, `received`); **cancelar** una en tránsito
-- devuelve el stock al origen. Cada pierna es un movimiento tipificado en el
-- ledger (E24), idempotente por `op_key` `transfer:<id>:out|in|cancel`.
--
-- Multi-tenant + RLS admin_all. Aditiva e idempotente. Plano de TIENDA.
-- =============================================================================

create table if not exists public.stock_transfers (
  id               bigint generated always as identity primary key,
  tenant_id        uuid not null,
  stock_item_id    bigint not null references public.stock_items(id) on delete cascade,
  from_location_id bigint not null references public.locations(id) on delete restrict,
  to_location_id   bigint not null references public.locations(id) on delete restrict,
  qty              numeric not null check (qty > 0),
  uom_id           bigint references public.uoms(id) on delete set null,
  -- in_transit → received | cancelled  (draft reservado para uso futuro)
  status           text not null default 'in_transit'
    check (status in ('draft', 'in_transit', 'received', 'cancelled')),
  note             text,
  shipped_at       timestamptz,
  received_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (from_location_id <> to_location_id)
);

create index if not exists stock_transfers_tenant_status_idx
  on public.stock_transfers (tenant_id, status, created_at desc);
create index if not exists stock_transfers_item_idx
  on public.stock_transfers (tenant_id, stock_item_id);

alter table public.stock_transfers enable row level security;

drop policy if exists stock_transfers_admin_all on public.stock_transfers;
create policy stock_transfers_admin_all on public.stock_transfers
  for all to authenticated
  using (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false))
  with check (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false));

-- =============================================================================
-- Rollback (staging):
--   drop table if exists public.stock_transfers;
-- =============================================================================
