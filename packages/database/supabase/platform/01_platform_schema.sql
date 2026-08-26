-- =============================================================================
-- E17 · HU-156/HU-172 — Esquema mínimo de la BD de PLATAFORMA (control plane)
-- =============================================================================
-- Se aplica en un PROYECTO SUPABASE PROPIO, distinto al del plano de tienda
-- (ver ADR-001 y DEPLOYMENT.md §16). Sólo el control plane accede a esta BD, con
-- service-role. Contiene el registro autoritativo de tenants y su routing de BD.
--
-- Idempotente. Empezar mínimo (tenants + db_ref); planes/suscripciones/dominios
-- se agregan en HU-172/173/192/193/174.
-- =============================================================================

create extension if not exists pgcrypto; -- gen_random_uuid()

-- Registro de tenants (espejo de los Teams de Stack Auth).
create table if not exists public.tenants (
  -- id del tenant. Se usa como `tenant_id` en la BD del plano de tienda.
  id             uuid primary key default gen_random_uuid(),
  -- Espejo del Team de Stack Auth (para sincronizar vía webhook).
  stack_team_id  text unique,
  name           text not null,
  -- Ciclo de vida del servicio (gobernado por billing en HU-193/194).
  status         text not null default 'active'
                 check (status in ('trialing','active','past_due','suspended','canceled')),
  -- Plan comercial (entitlements en HU-173).
  plan           text not null default 'free',
  -- Nivel de aislamiento de datos por plan (HU-200).
  data_isolation text not null default 'shared'
                 check (data_isolation in ('shared','schema','dedicated')),
  -- Routing de BD: null/'shared' => BD compartida (pooled + RLS);
  -- otro valor => clave de un destino dedicado (schema o proyecto/BD propio).
  db_ref         text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists tenants_status_idx on public.tenants (status);
create index if not exists tenants_stack_team_id_idx on public.tenants (stack_team_id);

-- RLS habilitada SIN política pública: sólo el service-role del control plane
-- (que omite RLS) puede leer/escribir. Nadie más tiene acceso.
alter table public.tenants enable row level security;

-- Trigger de updated_at.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists tenants_set_updated_at on public.tenants;
create trigger tenants_set_updated_at
  before update on public.tenants
  for each row execute function public.set_updated_at();

-- Tenant por defecto: DEBE coincidir con el default de la migración del plano de
-- tienda (e17/01_tenant_id.sql). Representa los datos existentes (single-tenant).
insert into public.tenants (id, stack_team_id, name, status, plan, data_isolation, db_ref)
values ('00000000-0000-0000-0000-000000000001', null, 'Tenant por defecto (migración)',
        'active', 'free', 'shared', null)
on conflict (id) do nothing;

-- =============================================================================
-- SIGUIENTE (roadmap E17, otros archivos/HU):
--   · plans, subscriptions (HU-173/192/193)   · domains (HU-174/175)
--   · audit_log de plataforma (HU-146/172)     · webhook sync Team→tenants (HU-156)
-- =============================================================================
