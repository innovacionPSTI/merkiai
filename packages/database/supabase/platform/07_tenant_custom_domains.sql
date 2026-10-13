-- =============================================================================
-- Plataforma · HU-279 — Multi-dominio por tenant (tabla de dominios)
-- =============================================================================
-- Reemplaza, a futuro, las columnas de dominio único de `tenants`
-- (primary_domain / domain_status / domain_requested / domain_verify_token) por
-- filas: cada tenant puede tener VARIOS dominios propios, con uno marcado como
-- PRIMARIO (canónico para URLs/emails/redirecciones). Cualquier dominio en
-- estado 'active' resuelve al tenant; el primario define la URL canónica.
--
-- Esta migración SOLO crea la estructura + backfill; la resolución de host, el
-- admin y el aprovisionamiento siguen usando las columnas de `tenants` hasta el
-- cutover (ver ADR / HU-279). Idempotente. Aplicar en el Supabase de PLATAFORMA.
-- =============================================================================

create table if not exists public.tenant_custom_domains (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  domain       text not null,
  status       text not null default 'pending' check (status in ('pending','verified','active')),
  verify_token text,
  is_primary   boolean not null default false,   -- dominio canónico del tenant
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Un dominio pertenece a un solo tenant (anti-takeover).
create unique index if not exists tenant_custom_domains_domain_uk
  on public.tenant_custom_domains (lower(domain));
-- Un solo primario por tenant.
create unique index if not exists tenant_custom_domains_primary_uk
  on public.tenant_custom_domains (tenant_id) where is_primary;
create index if not exists tenant_custom_domains_tenant_idx
  on public.tenant_custom_domains (tenant_id);
create index if not exists tenant_custom_domains_active_idx
  on public.tenant_custom_domains (lower(domain)) where status = 'active';

-- RLS: solo el control plane (service-role) toca esta tabla.
alter table public.tenant_custom_domains enable row level security;

create or replace function public.touch_tenant_custom_domains() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;
drop trigger if exists trg_touch_tenant_custom_domains on public.tenant_custom_domains;
create trigger trg_touch_tenant_custom_domains
  before update on public.tenant_custom_domains
  for each row execute function public.touch_tenant_custom_domains();

-- Backfill desde las columnas de `tenants` (un dominio por tenant que ya tenga uno).
insert into public.tenant_custom_domains (tenant_id, domain, status, verify_token, is_primary)
select t.id,
  lower(coalesce(t.primary_domain, t.domain_requested)),
  case when t.domain_status = 'active' then 'active'
       when t.domain_status = 'verified' then 'verified'
       else 'pending' end,
  t.domain_verify_token,
  (t.primary_domain is not null)
from public.tenants t
where (t.primary_domain is not null or t.domain_requested is not null)
  and not exists (select 1 from public.tenant_custom_domains d
                  where d.tenant_id = t.id and d.domain = lower(coalesce(t.primary_domain, t.domain_requested)));

-- =============================================================================
-- Rollback:
--   drop trigger if exists trg_touch_tenant_custom_domains on public.tenant_custom_domains;
--   drop function if exists public.touch_tenant_custom_domains();
--   drop table if exists public.tenant_custom_domains;
-- =============================================================================
