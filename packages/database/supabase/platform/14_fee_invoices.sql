-- =============================================================================
-- E17 · HU-441 — Cobro mensual de las comisiones de "Merkiai Pagos"
-- =============================================================================
-- Al cerrar cada mes, las comisiones causadas (`payment_fees.status='accrued'`)
-- de un tenant se agrupan en UNA cuenta de cobro por periodo (YYYY-MM) y se
-- cobran con el medio de pago ya registrado para su plan (token en el vault).
-- Idempotente por (tenant, periodo). Solo control plane.
-- =============================================================================

create table if not exists public.fee_invoices (
  id                  bigint generated always as identity primary key,
  tenant_id           uuid not null references public.tenants (id) on delete cascade,
  period              text not null check (period ~ '^[0-9]{4}-[0-9]{2}$'),
  amount_cents        integer not null default 0 check (amount_cents >= 0),
  currency            text not null default 'COP',
  status              text not null default 'pending'
                      check (status in ('pending','processing','paid','failed','waived')),
  attempts            integer not null default 0,
  last_attempt_at     timestamptz,
  last_error          text,
  provider_payment_id text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (tenant_id, period)
);
create index if not exists fee_invoices_status_idx on public.fee_invoices (status);

alter table public.payment_fees
  add column if not exists invoice_id bigint references public.fee_invoices (id) on delete set null;
create index if not exists payment_fees_invoice_idx on public.payment_fees (invoice_id);

alter table public.fee_invoices enable row level security;
