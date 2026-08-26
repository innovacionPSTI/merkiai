-- PoC HU-171 — Política RLS por claim tenant_id (estrategia primaria, ADR-001).
-- Ejecutar en el SQL Editor de Supabase (proyecto del plano de tienda) para
-- validar el aislamiento end-to-end. NO es parte del schema de producción.

-- 1) Tabla de ejemplo tenant-scoped
create table if not exists public.poc_notes (
  id          bigint generated always as identity primary key,
  tenant_id   uuid not null,
  body        text not null,
  created_at  timestamptz not null default now()
);

-- 2) Activar RLS (frontera dura)
alter table public.poc_notes enable row level security;

-- 3) Política: el rol authenticated sólo ve/opera filas de SU tenant.
--    El tenant llega en el claim del JWT: auth.jwt() ->> 'tenant_id'.
drop policy if exists poc_notes_tenant_isolation on public.poc_notes;
create policy poc_notes_tenant_isolation
  on public.poc_notes
  for all
  to authenticated
  using      (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- 4) Prueba manual:
--    - Inserta filas para dos tenants distintos (con service-role, saltando RLS).
--    - Conéctate como authenticated con un JWT que lleve tenant_id = A:
--        select * from poc_notes;   -- debe devolver SOLO las filas de A,
--                                   -- aunque no filtres por tenant_id.
--    - Repite con tenant_id = B → sólo filas de B.
--    - Sin claim tenant_id → 0 filas (la conversión ::uuid de null no coincide).
