-- =============================================================================
-- E28 · HU-461 — Idiomas y mercados por tienda (ADR-011)
-- =============================================================================
-- Un MERCADO = países + moneda + lista de precios (opcional) + locales habilitados
-- + locale por defecto + dominio (opcional). Cada tienda tiene exactamente un
-- mercado por defecto; su locale por defecto es el locale por defecto de la tienda.
--
-- Cero regresión (AC-1): toda tienda existente recibe el mercado "Colombia"
-- (es-CO, COP), que reproduce el comportamiento actual. Para tiendas nuevas, la
-- capa de datos devuelve ese mismo mercado virtual hasta que se guarde uno.
--
-- Locales soportados (ADR-011): es-CO, es-MX, es-ES, en-US. Multi-tenant + RLS
-- (lectura pública acotada por tenant para el storefront + admin_all). Plano de
-- TIENDA. Aditiva e idempotente.
-- =============================================================================

create table if not exists public.markets (
  id              bigint generated always as identity primary key,
  tenant_id       uuid not null,
  key             text not null,
  name            text not null,
  -- Países ISO 3166-1 alfa-2 que atiende el mercado (informativo hasta HU-467/468).
  countries       text[] not null default '{}',
  -- ISO 4217. Sin multimoneda (HU-467) todos los mercados usan la moneda base.
  currency        text not null default 'COP',
  price_list_id   bigint references public.price_lists(id) on delete set null,
  locales         text[] not null,
  default_locale  text not null,
  -- Dominio propio ligado al mercado (HU-279/HU-462). Opcional.
  domain          text,
  is_default      boolean not null default false,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (tenant_id, key),
  constraint markets_locales_not_empty check (cardinality(locales) >= 1),
  constraint markets_locales_supported check (locales <@ array['es-CO', 'es-MX', 'es-ES', 'en-US']::text[]),
  constraint markets_default_locale_enabled check (default_locale = any (locales)),
  constraint markets_currency_iso check (currency ~ '^[A-Z]{3}$'),
  constraint markets_key_format check (key ~ '^[a-z0-9][a-z0-9-]{0,31}$')
);

-- Exactamente un mercado por defecto por tienda (AC-5).
create unique index if not exists markets_one_default_uidx
  on public.markets (tenant_id) where is_default;

create index if not exists markets_tenant_idx on public.markets (tenant_id, active);

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table public.markets enable row level security;

-- Storefront: lectura de mercados activos de SU tenant (resolución de locale, HU-462).
drop policy if exists markets_tenant_read on public.markets;
create policy markets_tenant_read on public.markets
  for select to anon, authenticated
  using (active = true and tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Panel admin (is_admin): CRUD total sobre SU tenant.
drop policy if exists markets_admin_all on public.markets;
create policy markets_admin_all on public.markets
  for all to authenticated
  using (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false))
  with check (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false));

-- ── Mercado por defecto para las tiendas existentes (AC-1) ─────────────────────
insert into public.markets (tenant_id, key, name, countries, currency, locales, default_locale, is_default)
select distinct sc.tenant_id, 'colombia', 'Colombia', array['CO'], 'COP', array['es-CO'], 'es-CO', true
from public.store_config sc
where sc.tenant_id is not null
  and not exists (select 1 from public.markets m where m.tenant_id = sc.tenant_id)
on conflict (tenant_id, key) do nothing;

comment on table public.markets is
  'E28 · HU-461: mercados de la tienda (países, moneda, lista de precios, locales). Un único mercado por defecto por tenant.';

-- Rollback (staging): drop table if exists public.markets;
