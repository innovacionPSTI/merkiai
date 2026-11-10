-- =============================================================================
-- E17 · HU-440 — Suscripciones SaaS y eventos de billing (BD de PLATAFORMA)
-- =============================================================================
-- Una suscripción por tenant (plan + ciclo + estado de cobro) y un registro
-- append-only de eventos del proveedor (PayZen) con clave de idempotencia, para
-- que un webhook reenviado no se procese dos veces (ADR-009).
--
-- El token del medio de pago NO se guarda aquí en claro: `payment_token_ref` es
-- una referencia al vault (HU-362). Idempotente. Solo control plane.
-- =============================================================================

create table if not exists public.subscriptions (
  tenant_id                uuid primary key references public.tenants (id) on delete cascade,
  plan                     text not null references public.plans (key),
  billing_interval         text not null default 'monthly' check (billing_interval in ('monthly','yearly')),
  amount_cents             integer not null check (amount_cents >= 0),
  currency                 text not null default 'COP',
  status                   text not null default 'trialing'
                           check (status in ('trialing','active','past_due','suspended','canceled')),
  provider                 text not null default 'payzen',
  provider_subscription_id text,
  payment_token_ref        text,                 -- referencia en kms-vault, nunca el token
  current_period_end       timestamptz,
  past_due_since           timestamptz,
  failed_attempts          integer not null default 0,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index if not exists subscriptions_status_idx on public.subscriptions (status);

create table if not exists public.billing_events (
  id          bigint generated always as identity primary key,
  tenant_id   uuid references public.tenants (id) on delete set null,
  provider    text not null,
  event_key   text not null,                     -- idempotencia (uuid de transacción del proveedor)
  type        text not null,
  amount_cents integer,
  currency    text,
  payload     jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  unique (provider, event_key)
);
create index if not exists billing_events_tenant_idx on public.billing_events (tenant_id, created_at desc);

alter table public.subscriptions  enable row level security;  -- solo service-role
alter table public.billing_events enable row level security;
