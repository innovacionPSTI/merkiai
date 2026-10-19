-- =============================================================================
-- E17 · HU-160 — Plantillas de email editables
-- =============================================================================
-- Override por tienda del ASUNTO y el CUERPO de cada correo transaccional, con
-- variables ({{order_number}}, {{customer_name}}, …) y toggle de activación por
-- tipo. El layout (header/logo/tema/footer) lo sigue renderizando la app; esto
-- solo personaliza texto. Si no hay override para un tipo, se usa el default de
-- sistema (en código). RLS por tenant, gestión solo panel (is_admin). Lectura
-- también para el envío server-side (machine-db bypassa RLS). Idempotente.
-- Aplicar en el proyecto Supabase del PLANO DE TIENDA.
-- =============================================================================

create table if not exists public.email_templates (
  id          bigserial    primary key,
  tenant_id   uuid         not null,
  type        text         not null,                 -- 'order.shipped' | 'payment.confirmed' | ...
  locale      text         not null default 'es',    -- i18n-ready (HU-114)
  subject     text         not null,
  body        text         not null,                 -- texto con {{variables}} y saltos de línea
  enabled     boolean      not null default true,    -- silenciar el envío de este tipo
  updated_at  timestamptz  not null default now()
);

create unique index if not exists email_templates_unique_idx
  on public.email_templates (tenant_id, type, locale);

alter table public.email_templates enable row level security;

drop policy if exists email_templates_admin_all on public.email_templates;
create policy email_templates_admin_all on public.email_templates
  for all to authenticated
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid and coalesce((auth.jwt() ->> 'is_admin')::boolean, false))
  with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid and coalesce((auth.jwt() ->> 'is_admin')::boolean, false));
