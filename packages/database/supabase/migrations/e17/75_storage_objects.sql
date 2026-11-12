-- =============================================================================
-- E26 · HU-432 — Inventario de objetos de storage por tenant (medición de uso)
-- =============================================================================
-- Cada archivo que sube el admin queda registrado aquí (clave, tamaño, carpeta)
-- sea cual sea el proveedor (Supabase Storage, R2 o S3). Sirve para:
--   · medir el uso por tenant (suma de `size_bytes`) y aplicar el tope del plan
--     (`max_media_mb`), y
--   · saber qué borrar al dar de baja una tienda o al migrar de proveedor.
-- Multi-tenant + RLS admin_all. Aditiva e idempotente. Plano de TIENDA.
-- =============================================================================

create table if not exists public.storage_objects (
  id           bigint generated always as identity primary key,
  tenant_id    uuid not null,
  provider     text not null default 'supabase',
  key          text not null,
  folder       text not null,
  size_bytes   bigint not null default 0 check (size_bytes >= 0),
  content_type text,
  created_at   timestamptz not null default now(),
  unique (tenant_id, key)
);
create index if not exists storage_objects_tenant_idx on public.storage_objects (tenant_id);

alter table public.storage_objects enable row level security;

drop policy if exists storage_objects_admin_all on public.storage_objects;
create policy storage_objects_admin_all on public.storage_objects
  for all to authenticated
  using (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false))
  with check (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false));

-- Uso por tenant (bytes) sin traer filas al cliente.
create or replace view public.storage_usage as
  select tenant_id, coalesce(sum(size_bytes), 0)::bigint as bytes, count(*)::bigint as objects
  from public.storage_objects
  group by tenant_id;
alter view public.storage_usage set (security_invoker = true);

-- Backfill: lo ya registrado en la biblioteca de medios cuenta como uso.
insert into public.storage_objects (tenant_id, provider, key, folder, size_bytes, content_type, created_at)
select m.tenant_id, 'supabase', m.key, coalesce(m.bucket, split_part(m.key, '/', 1)), coalesce(m.size_bytes, 0), m.mime_type, coalesce(m.created_at, now())
from public.media_assets m
where m.tenant_id is not null and m.key is not null
on conflict (tenant_id, key) do nothing;

-- Rollback (staging): drop view if exists public.storage_usage; drop table if exists public.storage_objects;
