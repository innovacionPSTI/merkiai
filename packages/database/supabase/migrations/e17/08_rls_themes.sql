-- =============================================================================
-- E17 · HU-207 — RLS de `themes` (apariencia por tenant en el storefront)
-- =============================================================================
-- El storefront lee el tema activo con el cliente RLS anon (tenant-scoped). Sin
-- esta política, `anon` no puede leer `themes` y la tienda queda sin tema.
-- La escritura del tema la hace el admin (service-role, que omite RLS).
--
-- Idempotente. Aplicar en el proyecto Supabase del plano de tienda (admin/web).
-- =============================================================================

alter table public.themes enable row level security;

-- Lectura anon/authenticated acotada por tenant (apariencia = info pública).
drop policy if exists themes_public_read on public.themes;
drop policy if exists themes_tenant_read on public.themes;
create policy themes_tenant_read on public.themes
  for select
  to anon, authenticated
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Rollback:
--   drop policy if exists themes_tenant_read on public.themes;
--   create policy themes_public_read on public.themes for select using (true);
