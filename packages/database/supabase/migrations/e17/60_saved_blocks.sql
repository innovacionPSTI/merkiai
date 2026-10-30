-- =============================================================================
-- E17 · HU-358 — Biblioteca de bloques guardados
-- =============================================================================
-- Guarda una sección ya configurada (tipo + contenido + estilo + ítems) como
-- bloque reutilizable del tenant, para reinsertarla como copia editable. Extiende
-- la idea de "guardar como preset" (HU-256) al nivel de bloque. Solo autoría
-- (admin): no hay lectura pública. Scoped por tenant + RLS. Plano de tienda.
-- =============================================================================

create table if not exists public.saved_blocks (
  id           bigint generated always as identity primary key,
  tenant_id    uuid not null,
  label        text not null,
  section_type text not null,
  payload      jsonb not null default '{}'::jsonb,  -- snapshot: columnas + settings + items
  created_at   timestamptz not null default now()
);

create index if not exists saved_blocks_tenant_idx on public.saved_blocks (tenant_id, created_at desc);

alter table public.saved_blocks enable row level security;

drop policy if exists saved_blocks_admin_all on public.saved_blocks;
create policy saved_blocks_admin_all on public.saved_blocks
  for all to authenticated
  using (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false))
  with check (tenant_id = (auth.jwt()->>'tenant_id')::uuid and coalesce((auth.jwt()->>'is_admin')::boolean, false));

-- =============================================================================
-- Rollback: drop table if exists public.saved_blocks;
-- =============================================================================
