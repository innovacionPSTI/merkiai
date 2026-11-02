-- =============================================================================
-- E17 · HU-408 (Fase 1) — Cotizaciones y apartado/reserva
-- =============================================================================
-- Pedido en **borrador** (cotización) convertible a orden; base del apartado/
-- reserva. En esta fase se modela la cotización y su ciclo de vida + caducidad.
-- La reserva de stock (movimiento en el ledger), los abonos parciales (motor de
-- pagos) y la conversión a orden son Fase 2.
--
-- quotes       → cabecera (cliente, totales, vigencia, estado).
-- quote_items  → líneas (snapshot de nombre/precio; referencia opcional a
--                producto/variante del catálogo).
-- Multi-tenant + RLS admin_all (operativo; sin lectura pública). Aditiva e
-- idempotente. Plano de TIENDA.
-- =============================================================================

create table if not exists public.quotes (
  id                 bigint generated always as identity primary key,
  tenant_id          uuid not null,
  quote_number       text not null,
  customer_name      text not null default '',
  customer_email     text not null default '',
  customer_phone     text,
  -- draft → sent → accepted → converted | expired | cancelled
  status             text not null default 'draft'
    check (status in ('draft', 'sent', 'accepted', 'converted', 'expired', 'cancelled')),
  subtotal           numeric not null default 0 check (subtotal >= 0),
  discount           numeric not null default 0 check (discount >= 0),
  total              numeric not null default 0 check (total >= 0),
  valid_until        timestamptz,
  notes              text,
  converted_order_id bigint references public.orders(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (tenant_id, quote_number)
);

create index if not exists quotes_tenant_status_idx
  on public.quotes (tenant_id, status, created_at desc);

create table if not exists public.quote_items (
  id          bigint generated always as identity primary key,
  tenant_id   uuid not null,
  quote_id    bigint not null references public.quotes(id) on delete cascade,
  product_id  bigint references public.products(id) on delete set null,
  variant_id  bigint references public.product_variants(id) on delete set null,
  name        text not null,
  qty         numeric not null check (qty > 0),
  unit_price  numeric not null check (unit_price >= 0),
  line_total  numeric not null check (line_total >= 0),
  created_at  timestamptz not null default now()
);

create index if not exists quote_items_quote_idx
  on public.quote_items (tenant_id, quote_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table public.quotes      enable row level security;
alter table public.quote_items enable row level security;

drop policy if exists quotes_admin_all on public.quotes;
create policy quotes_admin_all on public.quotes
  for all to authenticated
  using (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false))
  with check (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false));

drop policy if exists quote_items_admin_all on public.quote_items;
create policy quote_items_admin_all on public.quote_items
  for all to authenticated
  using (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false))
  with check (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false));

-- =============================================================================
-- Rollback (staging):
--   drop table if exists public.quote_items;
--   drop table if exists public.quotes;
-- =============================================================================
