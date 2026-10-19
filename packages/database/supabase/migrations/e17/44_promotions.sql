-- =============================================================================
-- E17 · HU-147 — Motor de descuentos y promociones
-- =============================================================================
-- Reglas de promoción más allá de cupones (BOGO, % por categoría, descuento por
-- monto de carrito), con vigencia y combinabilidad. El cálculo del total es
-- autoridad del servidor (checkout). Gestión solo desde el panel (is_admin);
-- lectura pública de reglas activas por tenant para cotizar en el storefront.
-- RLS por tenant. Idempotente. Aplicar en el proyecto Supabase del PLANO DE TIENDA.
-- =============================================================================

create table if not exists public.promotions (
  id          bigserial    primary key,
  tenant_id   uuid         not null,
  name        text         not null,
  type        text         not null,                 -- 'cart_percent'|'cart_fixed'|'category_percent'|'bogo'
  config      jsonb        not null default '{}'::jsonb,
  active      boolean      not null default true,
  -- Prioridad: menor = se evalúa antes (relevante para reglas exclusivas).
  priority    int          not null default 100,
  -- combinable=false → regla EXCLUSIVA: si aplica, no se acumula con otras.
  combinable  boolean      not null default false,
  starts_at   timestamptz,
  ends_at     timestamptz,
  created_at  timestamptz  not null default now(),
  updated_at  timestamptz  not null default now(),
  constraint promotions_type_chk check (type in ('cart_percent','cart_fixed','category_percent','bogo'))
);

create index if not exists promotions_tenant_active_idx
  on public.promotions (tenant_id, active, priority);

alter table public.promotions enable row level security;

-- Lectura pública (anon + authenticated) de promociones activas del tenant:
-- el storefront cotiza el descuento. El servidor recalcula en el checkout.
drop policy if exists promotions_public_read on public.promotions;
create policy promotions_public_read on public.promotions
  for select to anon, authenticated
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid and active);

-- Gestión completa solo para el JWT del panel (is_admin=true) y su tenant.
drop policy if exists promotions_admin_all on public.promotions;
create policy promotions_admin_all on public.promotions
  for all to authenticated
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid and coalesce((auth.jwt() ->> 'is_admin')::boolean, false))
  with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid and coalesce((auth.jwt() ->> 'is_admin')::boolean, false));
