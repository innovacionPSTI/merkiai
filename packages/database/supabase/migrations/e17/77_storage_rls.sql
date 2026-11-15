-- ═══════════════════════════════════════════════════════════════════════════
-- e17/77 · Hardening — RLS de Supabase Storage por prefijo de tenant
-- ═══════════════════════════════════════════════════════════════════════════
-- Lleva la frontera de aislamiento de archivos al motor de storage (antes solo
-- en la app: el upload usaba service-role y la ruta prefijaba el tenant).
--
-- Formato de clave (HU-230/432): bucket = carpeta lógica, path = `<tenant_id>/<archivo>`.
-- Con estas políticas, un cliente con el JWT de tenant del panel
-- (`role=authenticated`, `tenant_id`, `is_admin=true`, ver apps/admin/lib/admin-db)
-- solo puede crear/modificar/borrar objetos bajo SU prefijo.
--
-- Lectura pública: los buckets son públicos → las URLs `/object/public/...`
-- no pasan por RLS (las imágenes de la tienda siguen sirviéndose igual).
--
-- Activación en la app: `STORAGE_RLS_ENFORCED=true` en el admin (sin la
-- variable se mantiene el comportamiento anterior). Idempotente.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) Buckets de las carpetas permitidas (STORAGE_FOLDERS), creados de antemano:
--    el cliente acotado por tenant no tiene permiso para crear buckets.
insert into storage.buckets (id, name, public) values
  ('products', 'products', true),
  ('media',    'media',    true),
  ('content',  'content',  true),
  ('logos',    'logos',    true),
  ('banners',  'banners',  true),
  ('blog',     'blog',     true)
on conflict (id) do nothing;

-- 2) Predicado común: carpeta permitida + admin del tenant + prefijo = tenant.
--    Objetos legacy sin prefijo (`<archivo>` en la raíz del bucket) solo los
--    gestiona el tenant por defecto (misma regla que `ownsKey` en la app).
create or replace function public.storage_tenant_can_write(p_bucket text, p_name text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select
    p_bucket in ('products', 'media', 'content', 'logos', 'banners', 'blog')
    and coalesce((auth.jwt() ->> 'is_admin')::boolean, false)
    and (auth.jwt() ->> 'tenant_id') is not null
    and (
      (storage.foldername(p_name))[1] = (auth.jwt() ->> 'tenant_id')
      or (
        coalesce(array_length(storage.foldername(p_name), 1), 0) = 0
        and (auth.jwt() ->> 'tenant_id') = '00000000-0000-0000-0000-000000000001'
      )
    )
$$;

comment on function public.storage_tenant_can_write(text, text) is
  'Hardening e17/77: un admin solo escribe objetos de storage bajo el prefijo de su tenant.';

-- 3) Políticas en storage.objects (rol authenticated = JWT de tenant del panel).
drop policy if exists storage_tenant_select on storage.objects;
create policy storage_tenant_select on storage.objects
  for select to authenticated
  using (public.storage_tenant_can_write(bucket_id, name));

drop policy if exists storage_tenant_insert on storage.objects;
create policy storage_tenant_insert on storage.objects
  for insert to authenticated
  with check (public.storage_tenant_can_write(bucket_id, name));

drop policy if exists storage_tenant_update on storage.objects;
create policy storage_tenant_update on storage.objects
  for update to authenticated
  using (public.storage_tenant_can_write(bucket_id, name))
  with check (public.storage_tenant_can_write(bucket_id, name));

drop policy if exists storage_tenant_delete on storage.objects;
create policy storage_tenant_delete on storage.objects
  for delete to authenticated
  using (public.storage_tenant_can_write(bucket_id, name));

-- Rollback (staging):
--   drop policy if exists storage_tenant_select on storage.objects;
--   drop policy if exists storage_tenant_insert on storage.objects;
--   drop policy if exists storage_tenant_update on storage.objects;
--   drop policy if exists storage_tenant_delete on storage.objects;
--   drop function if exists public.storage_tenant_can_write(text, text);
