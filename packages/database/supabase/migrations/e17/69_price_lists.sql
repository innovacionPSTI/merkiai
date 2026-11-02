-- =============================================================================
-- E17 · HU-407 — Listas de precio por canal / ubicación / segmento
-- =============================================================================
-- Precio efectivo por CONTEXTO (canal de venta, sede, segmento de cliente),
-- por encima del precio único del producto/variante y del precio de campaña.
-- Primitiva transversal: en línea vs. mostrador, sede A vs. sede B, mayorista
-- vs. minorista. Sin listas definidas, rige el precio actual (cero regresión).
--
-- price_lists       → lista con su ámbito (scope_type + scope_value) y prioridad.
-- price_list_items  → precio por (lista, producto) o (lista, variante).
-- Multi-tenant + RLS (lectura pública acotada por tenant para el storefront +
-- admin_all). Aditiva e idempotente. Plano de TIENDA.
-- =============================================================================

create table if not exists public.price_lists (
  id          bigint generated always as identity primary key,
  tenant_id   uuid not null,
  key         text not null,
  name        text not null,
  -- Ámbito de aplicación: 'channel' | 'location' | 'segment' | 'generic'
  scope_type  text not null default 'generic'
    check (scope_type in ('channel', 'location', 'segment', 'generic')),
  -- Valor del ámbito (p. ej. 'pos' | 'online', un id de sede, un segmento);
  -- null para 'generic' (aplica a todo contexto).
  scope_value text,
  -- Mayor prioridad gana cuando varias listas aplican al mismo contexto.
  priority    int not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (tenant_id, key)
);

create index if not exists price_lists_scope_idx
  on public.price_lists (tenant_id, scope_type, scope_value, active);

create table if not exists public.price_list_items (
  id            bigint generated always as identity primary key,
  tenant_id     uuid not null,
  price_list_id bigint not null references public.price_lists(id) on delete cascade,
  product_id    bigint references public.products(id) on delete cascade,
  variant_id    bigint references public.product_variants(id) on delete cascade,
  price         numeric not null check (price >= 0),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- Exactamente uno de product_id / variant_id debe estar presente.
  check (num_nonnulls(product_id, variant_id) = 1)
);

-- Un precio por (lista, producto) y por (lista, variante).
create unique index if not exists price_list_items_product_uidx
  on public.price_list_items (price_list_id, product_id) where product_id is not null;
create unique index if not exists price_list_items_variant_uidx
  on public.price_list_items (price_list_id, variant_id) where variant_id is not null;

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table public.price_lists      enable row level security;
alter table public.price_list_items enable row level security;

-- Lectura pública (storefront) acotada por tenant: solo listas activas.
drop policy if exists price_lists_tenant_read on public.price_lists;
create policy price_lists_tenant_read on public.price_lists
  for select to anon, authenticated
  using (active = true and tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

drop policy if exists price_list_items_tenant_read on public.price_list_items;
create policy price_list_items_tenant_read on public.price_list_items
  for select to anon, authenticated
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Panel admin (is_admin): CRUD total sobre SU tenant.
drop policy if exists price_lists_admin_all on public.price_lists;
create policy price_lists_admin_all on public.price_lists
  for all to authenticated
  using (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false))
  with check (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false));

drop policy if exists price_list_items_admin_all on public.price_list_items;
create policy price_list_items_admin_all on public.price_list_items
  for all to authenticated
  using (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false))
  with check (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false));

-- =============================================================================
-- Rollback (staging):
--   drop table if exists public.price_list_items;
--   drop table if exists public.price_lists;
-- =============================================================================
