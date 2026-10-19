-- =============================================================================
-- E17 · E19 (HU-292) — Avisos de campaña VIP (idempotencia)
-- =============================================================================
-- Traza de a quién se avisó de cada campaña y por qué canal, para no enviar el
-- mismo aviso dos veces (AC-2). Gestión solo desde el panel (is_admin). RLS por
-- tenant. Idempotente. Aplicar en el proyecto Supabase del PLANO DE TIENDA.
-- =============================================================================

create table if not exists public.vip_campaign_notifications (
  id          bigserial    primary key,
  tenant_id   uuid         not null,
  campaign_id bigint       not null references public.vip_campaigns (id) on delete cascade,
  customer_id uuid         not null references public.customers (id) on delete cascade,
  channel     text         not null default 'email',   -- 'email' | 'whatsapp' (futuro)
  sent_at     timestamptz  not null default now()
);

create unique index if not exists vip_campaign_notif_unique_idx
  on public.vip_campaign_notifications (campaign_id, customer_id, channel);

alter table public.vip_campaign_notifications enable row level security;

drop policy if exists vip_campaign_notifications_admin_all on public.vip_campaign_notifications;
create policy vip_campaign_notifications_admin_all on public.vip_campaign_notifications
  for all to authenticated
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid and coalesce((auth.jwt() ->> 'is_admin')::boolean, false))
  with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid and coalesce((auth.jwt() ->> 'is_admin')::boolean, false));
