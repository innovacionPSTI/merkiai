-- =============================================================================
-- E17 · HU-113 — Gestor de redirects 301
-- =============================================================================
-- Reglas de redirección permanente (301) origen→destino por tienda, definidas
-- desde el panel, para no perder tráfico ni SEO al renombrar rutas o slugs.
-- El storefront las resuelve en el middleware (lectura por tenant). El panel
-- (is_admin) las gestiona. RLS por tenant. Idempotente. Aplicar en el proyecto
-- Supabase del PLANO DE TIENDA.
-- =============================================================================

create table if not exists public.redirects (
  id          bigserial    primary key,
  tenant_id   uuid         not null,
  from_path   text         not null,                 -- ruta de origen, normalizada ('/ruta-vieja')
  to_path     text         not null,                 -- destino ('/ruta-nueva' o URL absoluta)
  status_code int          not null default 301,     -- 301 (permanente) | 302 (temporal)
  active      boolean      not null default true,
  note        text,                                  -- nota interna opcional
  created_at  timestamptz  not null default now(),
  updated_at  timestamptz  not null default now(),
  constraint redirects_status_chk check (status_code in (301, 302))
);

-- Una sola regla por (tenant, origen).
create unique index if not exists redirects_tenant_from_idx
  on public.redirects (tenant_id, from_path);

alter table public.redirects enable row level security;

-- Lectura pública (anon + authenticated) de reglas activas del tenant: el
-- storefront resuelve el redirect sin sesión. Patrón de catálogo público.
drop policy if exists redirects_public_read on public.redirects;
create policy redirects_public_read on public.redirects
  for select to anon, authenticated
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid and active);

-- Gestión completa solo para el JWT del panel (is_admin=true) y su tenant.
drop policy if exists redirects_admin_all on public.redirects;
create policy redirects_admin_all on public.redirects
  for all to authenticated
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid and coalesce((auth.jwt() ->> 'is_admin')::boolean, false))
  with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid and coalesce((auth.jwt() ->> 'is_admin')::boolean, false));
