-- =============================================================================
-- E17 · HU-400 — Ítem de inventario unificado (`stock_item`) + unidad de medida
-- =============================================================================
-- Fundación de la épica E24 (Operaciones e inventario). Introduce el **sujeto
-- único del inventario** (`stock_items`) con su **clase** (materia prima, insumo,
-- terminado, servicio) y su **unidad de medida** (`uoms`) con conversión a la
-- unidad base de su dimensión. Las cantidades son **decimales** (numeric).
--
-- La variante de producto vendible pasa a poder **enlazarse** a un stock_item de
-- clase 'terminado' (columna nullable en product_variants); el catálogo NO se
-- reescribe y el enlace es opcional → cero regresión.
--
-- Multi-tenant + RLS (patrón e17/06 + e17/10 admin_all). Aditiva e idempotente
-- (CREATE ... IF NOT EXISTS). Aplicar en el PLANO DE TIENDA.
-- =============================================================================

-- ── Unidades de medida ────────────────────────────────────────────────────────
-- dimension agrupa unidades convertibles entre sí (count/weight/volume/length).
-- to_base_factor convierte a la unidad base de la dimensión (base = factor 1).
create table if not exists public.uoms (
  id              bigint generated always as identity primary key,
  tenant_id       uuid not null,
  code            text not null,                         -- 'unidad','g','kg','ml','l'…
  name            text not null,
  dimension       text not null default 'count'
                    check (dimension in ('count','weight','volume','length')),
  to_base_factor  numeric not null default 1 check (to_base_factor > 0),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (tenant_id, code),
  unique (tenant_id, id)
);

-- ── Ítem de inventario ────────────────────────────────────────────────────────
create table if not exists public.stock_items (
  id            bigint generated always as identity primary key,
  tenant_id     uuid not null,
  key           text not null,                           -- slug (único por tenant)
  name          text not null,
  item_class    text not null default 'terminado'
                  check (item_class in ('materia_prima','insumo','terminado','servicio')),
  uom_id        bigint references public.uoms(id) on delete restrict,
  sellable      boolean not null default false,          -- no todo ítem es vendible
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (tenant_id, key),
  unique (tenant_id, id)
);

create index if not exists stock_items_tenant_class_idx
  on public.stock_items (tenant_id, item_class);

-- ── Enlace variante vendible → stock_item 'terminado' (opcional) ──────────────
alter table public.product_variants
  add column if not exists stock_item_id bigint
  references public.stock_items(id) on delete set null;

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table public.uoms        enable row level security;
alter table public.stock_items enable row level security;

-- Son datos internos de operación (no storefront público). CRUD solo del panel
-- (is_admin) sobre las filas de SU tenant. El service-role (SSR/máquina) omite RLS.
drop policy if exists uoms_admin_all on public.uoms;
create policy uoms_admin_all on public.uoms
  for all to authenticated
  using (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false))
  with check (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false));

drop policy if exists stock_items_admin_all on public.stock_items;
create policy stock_items_admin_all on public.stock_items
  for all to authenticated
  using (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false))
  with check (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false));

-- ── Seed de unidades base por tenant (idempotente) ────────────────────────────
-- Un juego mínimo y genérico para que el modelo sea usable de inmediato. 'unidad'
-- es la base de count; g/ml las bases de weight/volume; kg/l sus múltiplos.
insert into public.uoms (tenant_id, code, name, dimension, to_base_factor)
select t.tenant_id, v.code, v.name, v.dimension, v.factor
  from (select distinct tenant_id from public.pages) t
 cross join (values
    ('unidad','Unidad','count',   1),
    ('g',     'Gramo', 'weight',  1),
    ('kg',    'Kilogramo','weight',1000),
    ('ml',    'Mililitro','volume',1),
    ('l',     'Litro', 'volume',  1000)
 ) as v(code, name, dimension, factor)
 on conflict (tenant_id, code) do nothing;

-- =============================================================================
-- Rollback (staging):
--   alter table public.product_variants drop column if exists stock_item_id;
--   drop table if exists public.stock_items;
--   drop table if exists public.uoms;
-- =============================================================================
