-- =============================================================================
-- E27 · HU-450…456 — Cartera operativa (ADR-010)
-- =============================================================================
-- Una sola primitiva para crédito/fiado, encargos con anticipo, apartados y
-- consignación:
--   · receivable_documents   → el compromiso (modalidad, plan de pago, estados
--                               de PAGO y ENTREGA independientes)
--   · receivable_lines       → líneas genéricas (ítem de inventario/servicio o texto libre)
--   · receivable_installments→ cuotas (plan 'installments')
--   · receivable_movements   → LIBRO de cartera (append-only, idempotente por op_key);
--                               el saldo es PROYECCIÓN (vistas), nunca se edita.
--   · receivables_settings   → política por tienda (entrega de encargos, evento de
--                               facturación por modalidad, recordatorios, apartado)
--   · receivable_invoice_events → bandeja de eventos de facturación para la
--                               integración fiscal (la plataforma NO factura)
-- También: contrapartes (rol/cupo en customers), ubicación de tipo 'consignment'
-- ligada a un aliado y movimientos de inventario 'reserve'/'release' (apartado).
-- Multi-tenant + RLS admin_all. Aditiva e idempotente. Plano de TIENDA.
-- =============================================================================

-- ── Contrapartes: rol + cupo + condiciones (generaliza customers) ─────────────
alter table public.customers add column if not exists party_role text not null default 'customer';
alter table public.customers add column if not exists credit_limit integer;          -- null = sin cupo
alter table public.customers add column if not exists default_terms_days integer;    -- plazo por defecto
alter table public.customers add column if not exists document_id text;              -- NIT/CC (opcional)
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'customers_party_role_check') then
    alter table public.customers add constraint customers_party_role_check check (party_role in ('customer','consignee'));
  end if;
end $$;
-- Aliados o clientes de fiado pueden no tener correo (único por tenant cuando existe).
alter table public.customers alter column email drop not null;

-- ── Ubicación del aliado (consignación) ───────────────────────────────────────
alter table public.locations drop constraint if exists locations_kind_check;
alter table public.locations add constraint locations_kind_check check (kind in ('warehouse','store','pickup','consignment'));
alter table public.locations add column if not exists party_id uuid references public.customers(id) on delete set null;

-- ── Inventario: reserva/liberación (apartado) ─────────────────────────────────
alter table public.stock_movements drop constraint if exists stock_movements_movement_type_check;
alter table public.stock_movements add constraint stock_movements_movement_type_check check (movement_type in (
  'purchase','production_consume','production_output',
  'sale','waste','adjustment','transfer','sample','return','reserve','release'));

-- ── Ajustes por tienda ────────────────────────────────────────────────────────
create table if not exists public.receivables_settings (
  tenant_id              uuid primary key,
  delivery_policy        text not null default 'require_full_payment'
                         check (delivery_policy in ('require_full_payment','allow_balance_on_delivery')),
  -- Evento de facturación por modalidad: on_document | on_payment | on_delivery | on_settlement | none
  invoice_events         jsonb not null default '{"credit_sale":"on_delivery","special_order":"on_delivery","layaway":"on_settlement","consignment":"on_settlement"}',
  layaway_days           integer not null default 30 check (layaway_days > 0),
  reminder_days_before   integer not null default 3 check (reminder_days_before >= 0),
  reminder_days_after    integer not null default 3 check (reminder_days_after >= 0),
  reminders_enabled      boolean not null default false,
  updated_at             timestamptz not null default now()
);

-- ── Documentos ────────────────────────────────────────────────────────────────
create table if not exists public.receivable_documents (
  id                     bigint generated always as identity primary key,
  tenant_id              uuid not null,
  number                 text not null,
  party_id               uuid not null references public.customers(id) on delete restrict,
  modality               text not null check (modality in ('credit_sale','special_order','layaway','consignment')),
  payment_status         text not null default 'open'
                         check (payment_status in ('draft','open','partial','paid','overdue','written_off','void')),
  delivery_status        text not null default 'pending' check (delivery_status in ('pending','partial','delivered','returned')),
  total                  integer not null default 0 check (total >= 0),   -- pesos (misma unidad que orders.total)
  currency               text not null default 'COP',
  plan_type              text not null default 'free' check (plan_type in ('free','installments')),
  due_date               date,
  min_advance            integer not null default 0 check (min_advance >= 0),
  delivery_policy        text check (delivery_policy in ('require_full_payment','allow_balance_on_delivery')),
  location_id            bigint references public.locations(id) on delete set null,  -- origen (o ubicación del aliado)
  reservation_expires_at timestamptz,
  quote_id               bigint,
  order_id               bigint,
  production_order_id    bigint,
  notes                  text,
  last_reminder_kind     text,
  last_reminder_at       timestamptz,
  created_by             text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  unique (tenant_id, number)
);
create index if not exists receivable_documents_party_idx on public.receivable_documents (tenant_id, party_id);
create index if not exists receivable_documents_status_idx on public.receivable_documents (tenant_id, payment_status);

create table if not exists public.receivable_lines (
  id             bigint generated always as identity primary key,
  tenant_id      uuid not null,
  document_id    bigint not null references public.receivable_documents(id) on delete cascade,
  kind           text not null check (kind in ('item','free')),
  stock_item_id  bigint references public.stock_items(id) on delete set null,
  variant_id     bigint,
  description    text not null,
  qty            numeric not null check (qty > 0),
  unit_price     integer not null check (unit_price >= 0),
  total          integer not null check (total >= 0),
  qty_delivered  numeric not null default 0 check (qty_delivered >= 0),
  qty_returned   numeric not null default 0 check (qty_returned >= 0),
  qty_sold       numeric not null default 0 check (qty_sold >= 0),   -- consignación: reportado vendido
  created_at     timestamptz not null default now()
);
create index if not exists receivable_lines_doc_idx on public.receivable_lines (document_id);

create table if not exists public.receivable_installments (
  id           bigint generated always as identity primary key,
  tenant_id    uuid not null,
  document_id  bigint not null references public.receivable_documents(id) on delete cascade,
  seq          integer not null,
  due_date     date not null,
  amount       integer not null check (amount > 0),
  unique (document_id, seq)
);

-- ── LIBRO de cartera ──────────────────────────────────────────────────────────
-- delta > 0 aumenta la deuda (cargo); delta < 0 la reduce (abono, nota, castigo…).
create table if not exists public.receivable_movements (
  id             bigint generated always as identity primary key,
  tenant_id      uuid not null,
  party_id       uuid not null references public.customers(id) on delete restrict,
  document_id    bigint references public.receivable_documents(id) on delete restrict,
  line_id        bigint references public.receivable_lines(id) on delete set null,
  type           text not null check (type in ('charge','payment','credit_note','adjustment','write_off','credit_applied')),
  delta          integer not null check (delta <> 0),
  method         text,              -- cash | transfer | card | link | pos | store_credit | other
  reference      text,
  note           text,
  op_key         text,
  created_by     text,
  created_at     timestamptz not null default now()
);
create unique index if not exists receivable_movements_op_key_idx on public.receivable_movements (tenant_id, op_key) where op_key is not null;
create index if not exists receivable_movements_doc_idx on public.receivable_movements (document_id);
create index if not exists receivable_movements_party_idx on public.receivable_movements (tenant_id, party_id, created_at);

-- ── Bandeja de eventos de facturación (integración fiscal externa) ────────────
create table if not exists public.receivable_invoice_events (
  id           bigint generated always as identity primary key,
  tenant_id    uuid not null,
  document_id  bigint not null references public.receivable_documents(id) on delete cascade,
  event        text not null check (event in ('on_document','on_payment','on_delivery','on_settlement')),
  amount       integer not null default 0,
  payload      jsonb not null default '{}',
  status       text not null default 'pending' check (status in ('pending','sent','failed','ignored')),
  op_key       text,
  created_at   timestamptz not null default now()
);
create unique index if not exists receivable_invoice_events_op_idx on public.receivable_invoice_events (tenant_id, op_key) where op_key is not null;

-- ── Proyecciones (saldo = suma del libro) ─────────────────────────────────────
create or replace view public.receivable_document_balances as
  select d.id as document_id, d.tenant_id, d.party_id,
         coalesce(sum(m.delta) filter (where m.delta > 0), 0)::bigint as charged,
         coalesce(-sum(m.delta) filter (where m.delta < 0), 0)::bigint as credited,
         coalesce(sum(m.delta), 0)::bigint as balance
  from public.receivable_documents d
  left join public.receivable_movements m on m.document_id = d.id
  group by d.id, d.tenant_id, d.party_id;
alter view public.receivable_document_balances set (security_invoker = true);

create or replace view public.receivable_party_balances as
  select tenant_id, party_id, coalesce(sum(delta), 0)::bigint as balance
  from public.receivable_movements group by tenant_id, party_id;
alter view public.receivable_party_balances set (security_invoker = true);

-- ── RLS (admin_all por tenant) ────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['receivables_settings','receivable_documents','receivable_lines','receivable_installments','receivable_movements','receivable_invoice_events'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_admin_all', t);
    execute format($p$create policy %I on public.%I for all to authenticated
      using (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false))
      with check (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false))$p$,
      t || '_admin_all', t);
  end loop;
end $$;

-- Rollback (staging): drop views/tables en orden inverso; restaurar checks de locations/stock_movements.
