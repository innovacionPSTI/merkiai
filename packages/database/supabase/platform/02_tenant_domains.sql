-- =============================================================================
-- E17 · HU-157/174 — Dominios del tenant en la BD de PLATAFORMA
-- =============================================================================
-- Añade el subdominio por defecto y el dominio propio al registro `tenants`.
-- Son la fuente de verdad de la URL canónica del tenant (webhook/return de
-- pagos, SEO, emails), reemplazando a NEXT_PUBLIC_SITE_URL/ADMIN_URL.
--
-- Idempotente. Aplicar en el proyecto Supabase de PLATAFORMA (control plane).
-- =============================================================================

alter table public.tenants add column if not exists subdomain       text;
alter table public.tenants add column if not exists primary_domain  text;  -- dominio propio verificado (HU-174); null = usar subdominio

-- Únicos por plataforma (un subdominio/dominio → un solo tenant; anti-takeover).
create unique index if not exists tenants_subdomain_uk
  on public.tenants (lower(subdomain)) where subdomain is not null;
create unique index if not exists tenants_primary_domain_uk
  on public.tenants (lower(primary_domain)) where primary_domain is not null;

-- Tenant por defecto → subdominio de referencia (ajústalo a tu dominio real).
update public.tenants
  set subdomain = coalesce(subdomain, 'default')
  where id = '00000000-0000-0000-0000-000000000001';

-- Resolución de host → tenant (la usa el plano de tienda, HU-157):
--   select id, plan, status, db_ref from public.tenants
--     where lower(primary_domain) = lower($host)
--        or lower(subdomain) = lower(split_part($host, '.', 1));
