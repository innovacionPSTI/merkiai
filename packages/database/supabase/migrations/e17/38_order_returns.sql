-- =============================================================================
-- E17 · HU-107a — Workflow de devolución (RMA)
-- =============================================================================
-- El operador registra devoluciones de un pedido (motivo + estado) desde el
-- panel y, al aprobar, puede reponer el stock (reusa el RPC de inventario).
-- Gestión solo del panel (is_admin). RLS por tenant. Trazabilidad: cada
-- devolución queda asociada al pedido (historial consultable). La ejecución del
-- reembolso de dinero es HU-107b.
-- Idempotente. Aplicar en el proyecto Supabase del PLANO DE TIENDA.
-- =============================================================================

create table if not exists public.order_returns (
  id            serial       primary key,
  tenant_id     uuid         not null,
  order_id      int          not null,
  order_number  text         not null,
  reason        text,
  status        text         not null default 'requested'
                check (status in ('requested','approved','rejected')),
  restocked     boolean      not null default false,
  note          text,
  created_at    timestamptz  not null default now(),
  resolved_at   timestamptz
);

-- FK compuesta con tenant (patrón e17/04). Borra devoluciones si se borra el pedido.
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'order_returns_order_fk') then
    alter table public.order_returns
      add constraint order_returns_order_fk
      foreign key (order_id, tenant_id)
      references public.orders (id, tenant_id) on delete cascade;
  end if;
end $$;

create index if not exists order_returns_lookup_idx
  on public.order_returns (tenant_id, order_id, created_at desc);

alter table public.order_returns enable row level security;

-- Gestión: CRUD total solo para el JWT del panel (is_admin=true) y su tenant.
drop policy if exists order_returns_admin_all on public.order_returns;
create policy order_returns_admin_all on public.order_returns
  for all to authenticated
  using      (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid and coalesce((auth.jwt() ->> 'is_admin')::boolean, false))
  with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid and coalesce((auth.jwt() ->> 'is_admin')::boolean, false));
