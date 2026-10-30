-- =============================================================================
-- E17 · HU-353 — Colecciones (tipos de contenido dinámicos) · Constructor v2
-- =============================================================================
-- Pieza madre del contenido dirigido por datos: el editor define TIPOS de
-- contenido reutilizables (noticia, evento, curso, persona, documento…) con sus
-- campos tipados, y gestiona REGISTROS de cada tipo. Multi-tenant + RLS. Nada
-- específico de nicho: el motor es genérico (sirve a portal E23 y a educación E20).
--
-- Dos tablas, ambas con `tenant_id` + RLS (patrón e17/06 lectura pública acotada
-- por tenant + e17/10 admin_all):
--   collections       → definición del tipo (schema de campos en jsonb)
--   collection_items  → registros (valores de campos en jsonb), borrador/publicado
--
-- Aditiva e idempotente (CREATE ... IF NOT EXISTS). Aplicar en el PLANO DE TIENDA.
-- =============================================================================

-- ── Definición de tipo (colección) ──────────────────────────────────────────
create table if not exists public.collections (
  id           bigint generated always as identity primary key,
  tenant_id    uuid not null,
  key          text not null,                       -- identificador slug (único por tenant)
  label        text not null,
  label_plural text,
  description  text,
  icon         text,
  fields       jsonb not null default '[]'::jsonb,  -- [{ key,label,type,required,options,help,... }]
  enabled      boolean not null default true,
  order_index  int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (tenant_id, key)
);

-- ── Registros de la colección ────────────────────────────────────────────────
create table if not exists public.collection_items (
  id              bigint generated always as identity primary key,
  tenant_id       uuid not null,
  collection_key  text not null,
  slug            text not null,
  title           text,                              -- display/convenience (deriva de data)
  status          text not null default 'draft',     -- 'draft' | 'published'
  data            jsonb not null default '{}'::jsonb, -- valores por clave de campo
  order_index     int not null default 0,
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (tenant_id, collection_key, slug)
);

create index if not exists collection_items_tenant_coll_idx
  on public.collection_items (tenant_id, collection_key, order_index);

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table public.collections enable row level security;
alter table public.collection_items enable row level security;

-- Lectura pública (storefront anon/authenticated) acotada por tenant:
--   colecciones habilitadas; registros SOLO publicados.
drop policy if exists collections_tenant_read on public.collections;
create policy collections_tenant_read on public.collections
  for select to anon, authenticated
  using (enabled = true and tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

drop policy if exists collection_items_tenant_read on public.collection_items;
create policy collection_items_tenant_read on public.collection_items
  for select to anon, authenticated
  using (status = 'published' and tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Panel admin (is_admin) — CRUD total sobre las filas de SU tenant.
drop policy if exists collections_admin_all on public.collections;
create policy collections_admin_all on public.collections
  for all to authenticated
  using (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false))
  with check (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false));

drop policy if exists collection_items_admin_all on public.collection_items;
create policy collection_items_admin_all on public.collection_items
  for all to authenticated
  using (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false))
  with check (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false));

-- =============================================================================
-- Rollback (staging):
--   drop table if exists public.collection_items;
--   drop table if exists public.collections;
-- =============================================================================
