-- =============================================================================
-- E17 · HU-441 — "Merkiai Pagos" (Modelo B · reventa de PayZen, SIN custodia)
-- =============================================================================
-- Cada tenant con Merkiai Pagos es una TIENDA PayZen bajo la cuenta multitienda
-- de Merkiai, con la cuenta bancaria del tenant como destino (el dinero va
-- directo al tenant). Merkiai cobra una tarifa por transacción (markup) que es
-- PARAMETRIZABLE por plan y, opcionalmente, por tenant (ADR-009 §3).
--
--  · payment_fee_terms         → tarifa por plan (% + fijo).
--  · merkiai_payment_accounts  → la tienda PayZen gestionada de cada tenant
--                                (contraseña SOLO como referencia al vault).
--  · payment_fees              → comisiones causadas por venta aprobada
--                                (idempotente por transacción) para facturar.
-- Solo control plane (RLS sin políticas → service-role). Idempotente.
-- =============================================================================

create table if not exists public.payment_fee_terms (
  plan          text primary key references public.plans (key) on delete cascade,
  fee_pct       numeric(6,3) not null default 0 check (fee_pct >= 0 and fee_pct < 100),
  fee_fixed_cents integer   not null default 0 check (fee_fixed_cents >= 0),
  updated_at    timestamptz not null default now()
);

create table if not exists public.merkiai_payment_accounts (
  tenant_id     uuid primary key references public.tenants (id) on delete cascade,
  provider      text not null default 'payzen',
  status        text not null default 'pending' check (status in ('pending','active','disabled')),
  shop_id       text,
  password_ref  text,                         -- referencia en kms-vault, nunca la contraseña
  environment   text not null default 'test' check (environment in ('test','production')),
  -- Override por tenant (null = usa la tarifa del plan).
  fee_pct_override        numeric(6,3) check (fee_pct_override is null or (fee_pct_override >= 0 and fee_pct_override < 100)),
  fee_fixed_cents_override integer     check (fee_fixed_cents_override is null or fee_fixed_cents_override >= 0),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.payment_fees (
  id            bigint generated always as identity primary key,
  tenant_id     uuid not null references public.tenants (id) on delete cascade,
  provider      text not null default 'payzen',
  payment_id    text not null,               -- uuid de la transacción (idempotencia)
  order_number  text not null,
  amount_cents  integer not null check (amount_cents >= 0),
  currency      text not null default 'COP',
  fee_pct       numeric(6,3) not null,
  fee_fixed_cents integer not null,
  fee_cents     integer not null check (fee_cents >= 0),
  status        text not null default 'accrued' check (status in ('accrued','invoiced','charged','void')),
  created_at    timestamptz not null default now(),
  unique (tenant_id, payment_id)
);
create index if not exists payment_fees_tenant_month_idx on public.payment_fees (tenant_id, created_at desc);

alter table public.payment_fee_terms        enable row level security;
alter table public.merkiai_payment_accounts enable row level security;
alter table public.payment_fees             enable row level security;
