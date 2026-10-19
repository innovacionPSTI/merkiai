-- =============================================================================
-- E17 · HU-168 — Bundles / kits de producto
-- =============================================================================
-- Un bundle agrupa varias variantes de producto como una sola unidad con precio
-- propio. La disponibilidad se deriva del componente más restrictivo y el stock
-- se descuenta por componente en el checkout (Fase 2). Lectura pública de
-- bundles activos (storefront); gestión solo panel (is_admin). RLS por tenant.
-- Idempotente. Aplicar en el proyecto Supabase del PLANO DE TIENDA.
-- =============================================================================

create table if not exists public.bundles (
  id          bigserial    primary key,
  tenant_id   uuid         not null,
  name        text         not null,
  slug        text         not null,
  description text,
  price       int          not null,
  image_url   text,
  active      boolean      not null default true,
  created_at  timestamptz  not null default now(),
  updated_at  timestamptz  not null default now(),
  constraint bundles_price_chk check (price >= 0)
);

create unique index if not exists bundles_tenant_slug_idx on public.bundles (tenant_id, slug);

create table if not exists public.bundle_components (
  id         bigserial  primary key,
  tenant_id  uuid       not null,
  bundle_id  bigint     not null references public.bundles (id) on delete cascade,
  variant_id bigint     not null references public.product_variants (id) on delete cascade,
  qty        int        not null default 1,
  constraint bundle_components_qty_chk check (qty >= 1)
);

create index if not exists bundle_components_bundle_idx on public.bundle_components (bundle_id);
create unique index if not exists bundle_components_unique_idx on public.bundle_components (bundle_id, variant_id);

alter table public.bundles           enable row level security;
alter table public.bundle_components enable row level security;

-- Lectura pública de bundles activos (storefront).
drop policy if exists bundles_public_read on public.bundles;
create policy bundles_public_read on public.bundles
  for select to anon, authenticated
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid and active);

drop policy if exists bundle_components_public_read on public.bundle_components;
create policy bundle_components_public_read on public.bundle_components
  for select to anon, authenticated
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Gestión completa solo panel (is_admin).
do $$
declare t text;
begin
  foreach t in array array['bundles','bundle_components']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_admin_all', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (tenant_id = (auth.jwt() ->> ''tenant_id'')::uuid and coalesce((auth.jwt() ->> ''is_admin'')::boolean, false)) with check (tenant_id = (auth.jwt() ->> ''tenant_id'')::uuid and coalesce((auth.jwt() ->> ''is_admin'')::boolean, false))',
      t || '_admin_all', t
    );
  end loop;
end $$;
