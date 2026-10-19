-- =============================================================================
-- E17 · HU-162 — Registro de emails (email_log)
-- =============================================================================
-- Traza de correos transaccionales enviados y sus fallos (trazabilidad/soporte),
-- reemplazando los `.catch` mudos. Append-only; gestión/lectura solo panel
-- (is_admin). RLS por tenant. Idempotente. Aplicar en el proyecto Supabase del
-- PLANO DE TIENDA.
-- =============================================================================

create table if not exists public.email_log (
  id          bigserial    primary key,
  tenant_id   uuid         not null,
  to_email    text         not null,
  type        text         not null,                 -- 'order.status' | 'order.payment' | 'back_in_stock' | 'vip.invite' ...
  provider    text,                                  -- 'resend' ...
  status      text         not null,                 -- 'sent' | 'failed' | 'suppressed'
  entity      text,                                  -- referencia (p. ej. order_number)
  error       text,                                  -- mensaje de error si status='failed'
  created_at  timestamptz  not null default now()
);

create index if not exists email_log_lookup_idx on public.email_log (tenant_id, created_at desc);
create index if not exists email_log_type_idx   on public.email_log (tenant_id, type, created_at desc);

alter table public.email_log enable row level security;

drop policy if exists email_log_admin_read on public.email_log;
create policy email_log_admin_read on public.email_log
  for select to authenticated
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid and coalesce((auth.jwt() ->> 'is_admin')::boolean, false));

drop policy if exists email_log_admin_insert on public.email_log;
create policy email_log_admin_insert on public.email_log
  for insert to authenticated
  with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid and coalesce((auth.jwt() ->> 'is_admin')::boolean, false));
