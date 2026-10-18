-- =============================================================================
-- E17 · HU-146 — Registro de auditoría
-- =============================================================================
-- Traza de operaciones sensibles del panel (quién hizo qué y cuándo): export /
-- import / backup / acciones masivas (cierra AC-3 de HU-134), cambios de estado
-- de pedido y pago, y devoluciones (AC-3 de HU-107a). Solo el panel (is_admin)
-- escribe/lee; RLS por tenant. Append-only en la práctica (sin update/delete).
-- Idempotente. Aplicar en el proyecto Supabase del PLANO DE TIENDA.
-- =============================================================================

create table if not exists public.audit_log (
  id          bigserial    primary key,
  tenant_id   uuid         not null,
  actor_email text,                                  -- quién (email del admin)
  actor_role  text,                                  -- rol en el momento
  action      text         not null,                 -- p. ej. 'data.export', 'order.status'
  entity      text,                                  -- p. ej. 'products', 'order'
  entity_id   text,                                  -- id/clave afectada (texto genérico)
  summary     text,                                  -- descripción legible
  metadata    jsonb        not null default '{}'::jsonb,
  created_at  timestamptz  not null default now()
);

create index if not exists audit_log_lookup_idx
  on public.audit_log (tenant_id, created_at desc);
create index if not exists audit_log_action_idx
  on public.audit_log (tenant_id, action, created_at desc);

alter table public.audit_log enable row level security;

-- Lectura e inserción solo para el JWT del panel (is_admin=true) y su tenant.
-- (Sin update/delete: el log es append-only.)
drop policy if exists audit_log_admin_read on public.audit_log;
create policy audit_log_admin_read on public.audit_log
  for select to authenticated
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid and coalesce((auth.jwt() ->> 'is_admin')::boolean, false));

drop policy if exists audit_log_admin_insert on public.audit_log;
create policy audit_log_admin_insert on public.audit_log
  for insert to authenticated
  with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid and coalesce((auth.jwt() ->> 'is_admin')::boolean, false));
