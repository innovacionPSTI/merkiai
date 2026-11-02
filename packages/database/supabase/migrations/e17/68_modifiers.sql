-- =============================================================================
-- E17 · HU-406 — Modificadores / opciones de producto
-- =============================================================================
-- Opciones que ajustan el precio de un producto y, si aplica, **consumen
-- inventario** (p. ej. "extra queso" +$ y −30 g de queso). Primitiva transversal:
-- sirve a servicio en sala (adiciones), a comercio electrónico (personalización)
-- y a retail (ninguno). Sin modificadores, el producto no cambia.
--
-- modifier_groups  → grupo de opciones sobre un producto (min/max selección).
-- modifier_options → opción con ajuste de precio y consumo opcional de stock_item.
-- Multi-tenant + RLS (lectura pública acotada por tenant para el storefront +
-- admin_all). Aditiva e idempotente. Plano de TIENDA.
-- =============================================================================

create table if not exists public.modifier_groups (
  id          bigint generated always as identity primary key,
  tenant_id   uuid not null,
  product_id  bigint not null references public.products(id) on delete cascade,
  name        text not null,
  min_select  int not null default 0 check (min_select >= 0),
  max_select  int not null default 1 check (max_select >= 0),   -- 0 = sin tope
  required    boolean not null default false,
  active      boolean not null default true,
  order_index int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists modifier_groups_product_idx
  on public.modifier_groups (tenant_id, product_id, order_index);

create table if not exists public.modifier_options (
  id                   bigint generated always as identity primary key,
  tenant_id            uuid not null,
  group_id             bigint not null references public.modifier_groups(id) on delete cascade,
  name                 text not null,
  price_delta          numeric not null default 0,              -- +/- al precio
  consume_stock_item_id bigint references public.stock_items(id) on delete set null,
  consume_qty          numeric check (consume_qty is null or consume_qty > 0),
  consume_uom_id       bigint references public.uoms(id) on delete set null,
  active               boolean not null default true,
  order_index          int not null default 0,
  created_at           timestamptz not null default now()
);

create index if not exists modifier_options_group_idx
  on public.modifier_options (tenant_id, group_id, order_index);

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table public.modifier_groups  enable row level security;
alter table public.modifier_options enable row level security;

-- Lectura pública (storefront) acotada por tenant: solo grupos/opciones activos.
drop policy if exists modifier_groups_tenant_read on public.modifier_groups;
create policy modifier_groups_tenant_read on public.modifier_groups
  for select to anon, authenticated
  using (active = true and tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

drop policy if exists modifier_options_tenant_read on public.modifier_options;
create policy modifier_options_tenant_read on public.modifier_options
  for select to anon, authenticated
  using (active = true and tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Panel admin (is_admin): CRUD total sobre SU tenant.
drop policy if exists modifier_groups_admin_all on public.modifier_groups;
create policy modifier_groups_admin_all on public.modifier_groups
  for all to authenticated
  using (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false))
  with check (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false));

drop policy if exists modifier_options_admin_all on public.modifier_options;
create policy modifier_options_admin_all on public.modifier_options
  for all to authenticated
  using (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false))
  with check (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false));

-- =============================================================================
-- Rollback (staging):
--   drop table if exists public.modifier_options;
--   drop table if exists public.modifier_groups;
-- =============================================================================
