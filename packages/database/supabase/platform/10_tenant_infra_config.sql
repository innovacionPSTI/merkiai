-- =============================================================================
-- E17 · HU-361 — Configuración de infra por-tenant (BD de PLATAFORMA)
-- =============================================================================
-- Config de infraestructura de tenants DEDICADOS (endpoint de su BD, base URL,
-- DSN de monitoreo, región), gestionada desde la consola y resuelta por el
-- connection factory (ADR-007). Indexada por `db_ref` (coincide con tenants.db_ref).
--
-- IMPORTANTE: los VALORES secretos (anon/service key, JWT secret de esa instancia)
-- NO se guardan aquí. Esta tabla guarda solo **referencias** (`secret_ref_*`) que
-- el vault (AWS KMS, HU-362) resuelve server-side. Un dump de plataforma no
-- entrega llaves (ADR-007 §3).
--
-- Idempotente. Aplicar en el proyecto Supabase de PLATAFORMA. Requiere 01_platform_schema.
-- =============================================================================

create table if not exists public.tenant_infra_config (
  tenant_id              uuid primary key references public.tenants (id) on delete cascade,
  -- Clave de routing: debe coincidir con tenants.db_ref del mismo tenant.
  db_ref                 text not null unique,
  -- Config NO secreta ---------------------------------------------------------
  db_url                 text not null,            -- endpoint Postgres/Supabase de su instancia
  base_url               text,                     -- base URL de la instancia (si app-tier dedicada)
  sentry_dsn             text,                      -- DSN de monitoreo (no secreto crítico)
  region                 text,
  -- Referencias a material SECRETO (NO el valor; las resuelve el vault) --------
  secret_ref_anon_key    text,                      -- anon/publishable de su BD
  secret_ref_service_key text,                      -- service-role de su BD
  secret_ref_jwt_secret  text,                      -- JWT secret de esa instancia
  -- Estado del registro -------------------------------------------------------
  status                 text not null default 'draft'
                         check (status in ('draft','active','rotating','disabled')),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists tenant_infra_config_status_idx
  on public.tenant_infra_config (status);

comment on table public.tenant_infra_config is
  'HU-361 · Config de infra por-tenant dedicado. Solo config no secreta + referencias a secretos (resueltos por el vault, HU-362). Solo control plane (service-role).';

-- RLS habilitada SIN política pública: solo el service-role del control plane.
alter table public.tenant_infra_config enable row level security;

-- Coherencia: db_ref no puede ser 'shared' (eso es el destino compartido por env).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tenant_infra_config_db_ref_not_shared'
  ) then
    alter table public.tenant_infra_config
      add constraint tenant_infra_config_db_ref_not_shared
      check (db_ref <> 'shared' and length(db_ref) > 0);
  end if;
end $$;
