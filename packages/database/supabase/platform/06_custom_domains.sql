-- =============================================================================
-- Plataforma · dominios propios (HU-174)
-- =============================================================================
-- Estado de verificación del dominio propio de cada tenant. El flujo:
--   none → pending (el comerciante pide el dominio; se emite un token TXT)
--        → verified (el control plane resolvió el TXT y coincide)
--        → active   (primary_domain apunta al dominio; sirve la tienda)
-- `primary_domain` (ya existente) solo debe activarse cuando domain_status llega
-- a 'verified'/'active' — el gating vive en el endpoint interno (anti-hijack).
-- Idempotente. Aplicar en el proyecto Supabase de PLATAFORMA.
-- =============================================================================

alter table public.tenants
  add column if not exists domain_status text not null default 'none',
  add column if not exists domain_verify_token text,
  add column if not exists domain_requested text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'tenants_domain_status_check') then
    alter table public.tenants
      add constraint tenants_domain_status_check
      check (domain_status in ('none','pending','verified','active'));
  end if;
end$$;
