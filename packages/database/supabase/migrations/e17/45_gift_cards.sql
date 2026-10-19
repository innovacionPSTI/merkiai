-- =============================================================================
-- E17 · HU-148 — Gift cards y saldo a favor (store credit)
-- =============================================================================
-- Gift cards con saldo canjeable y un ledger de saldo a favor por cliente
-- (append-only, el balance = suma de los deltas). El canje en el checkout valida
-- server-side (fase 2). El saldo a favor soporta reembolsos como crédito
-- (HU-107). Gestión desde el panel (is_admin); el cliente ve su propio saldo.
-- RLS por tenant. Idempotente. Aplicar en el proyecto Supabase del PLANO DE TIENDA.
-- =============================================================================

create table if not exists public.gift_cards (
  id              bigserial    primary key,
  tenant_id       uuid         not null,
  code            text         not null,
  initial_balance int          not null,
  balance         int          not null,
  active          boolean      not null default true,
  note            text,
  expires_at      timestamptz,
  created_at      timestamptz  not null default now(),
  updated_at      timestamptz  not null default now(),
  constraint gift_cards_balance_chk check (balance >= 0)
);

create unique index if not exists gift_cards_tenant_code_idx
  on public.gift_cards (tenant_id, code);

-- Ledger de saldo a favor (append-only). balance = sum(delta) por cliente.
create table if not exists public.store_credit_ledger (
  id          bigserial    primary key,
  tenant_id   uuid         not null,
  customer_id uuid         not null references public.customers (id) on delete cascade,
  delta       int          not null,                 -- + abono / − consumo
  reason      text,                                  -- 'refund' | 'manual' | 'order' ...
  order_id    bigint,                                -- referencia opcional
  created_at  timestamptz  not null default now()
);

create index if not exists store_credit_customer_idx
  on public.store_credit_ledger (tenant_id, customer_id, created_at);

alter table public.gift_cards          enable row level security;
alter table public.store_credit_ledger enable row level security;

-- Gift cards: gestión solo panel (is_admin). El canje en el storefront usa el
-- cliente-máquina (service-role), así que no necesita policy pública.
drop policy if exists gift_cards_admin_all on public.gift_cards;
create policy gift_cards_admin_all on public.gift_cards
  for all to authenticated
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid and coalesce((auth.jwt() ->> 'is_admin')::boolean, false))
  with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid and coalesce((auth.jwt() ->> 'is_admin')::boolean, false));

-- Store credit: el panel gestiona todo; el cliente autenticado lee SOLO su saldo
-- (customer propio por stack_id del JWT).
drop policy if exists store_credit_admin_all on public.store_credit_ledger;
create policy store_credit_admin_all on public.store_credit_ledger
  for all to authenticated
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid and coalesce((auth.jwt() ->> 'is_admin')::boolean, false))
  with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid and coalesce((auth.jwt() ->> 'is_admin')::boolean, false));

drop policy if exists store_credit_own_read on public.store_credit_ledger;
create policy store_credit_own_read on public.store_credit_ledger
  for select to authenticated
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and customer_id in (
      select id from public.customers
      where tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        and stack_id = (auth.jwt() ->> 'sub')
    )
  );
