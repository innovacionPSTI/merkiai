-- =============================================================================
-- E17 · HU-105 — "Avísame cuando vuelva" (back-in-stock)
-- =============================================================================
-- Un comprador deja su correo para una variante agotada; al reponer stock se le
-- avisa una sola vez y se marca `notified_at`. Alta pública (anon/authenticated
-- con JWT de tenant) en su propio tenant; el aviso/moderación lo hace el panel
-- (is_admin). RLS por tenant. Idempotencia por índice único parcial sobre las
-- suscripciones aún no notificadas.
-- Idempotente. Aplicar en el proyecto Supabase del PLANO DE TIENDA.
-- =============================================================================

create table if not exists public.stock_notifications (
  id          serial       primary key,
  tenant_id   uuid         not null,
  variant_id  int          not null,
  email       text         not null,
  created_at  timestamptz  not null default now(),
  notified_at timestamptz                          -- null = pendiente de aviso
);

-- FK compuesta con tenant (patrón e17/04). Borra avisos si se borra la variante.
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'stock_notifications_variant_fk'
  ) then
    alter table public.stock_notifications
      add constraint stock_notifications_variant_fk
      foreign key (variant_id, tenant_id)
      references public.product_variants (id, tenant_id) on delete cascade;
  end if;
end $$;

-- Búsqueda de pendientes por variante.
create index if not exists stock_notifications_pending_idx
  on public.stock_notifications (tenant_id, variant_id)
  where notified_at is null;

-- Idempotencia: una sola suscripción pendiente por (tenant, variante, correo).
create unique index if not exists stock_notifications_unique_pending
  on public.stock_notifications (tenant_id, variant_id, lower(email))
  where notified_at is null;

alter table public.stock_notifications enable row level security;

-- Alta pública: el comprador puede crear en su tenant y SIEMPRE sin notificar.
drop policy if exists stock_notifications_public_insert on public.stock_notifications;
create policy stock_notifications_public_insert on public.stock_notifications
  for insert to anon, authenticated
  with check (notified_at is null and tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Gestión/aviso: CRUD total solo para el JWT del panel (is_admin=true) y su tenant.
drop policy if exists stock_notifications_admin_all on public.stock_notifications;
create policy stock_notifications_admin_all on public.stock_notifications
  for all to authenticated
  using      (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid and coalesce((auth.jwt() ->> 'is_admin')::boolean, false))
  with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid and coalesce((auth.jwt() ->> 'is_admin')::boolean, false));
