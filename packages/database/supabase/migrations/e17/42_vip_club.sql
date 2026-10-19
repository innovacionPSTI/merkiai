-- =============================================================================
-- E17 · E19 (HU-288/289) — Club VIP: segmentos de clientes + campañas de
-- acceso anticipado
-- =============================================================================
-- Segmentos (manuales o por reglas) y campañas de venta exclusiva por ventana
-- horaria dirigidas a un segmento, con alcance de productos/categorías y oferta
-- opcional. Gating transversal por entitlement `vip_early_access` (plan) + RLS
-- por tenant. Gestión solo desde el panel (is_admin). El storefront resuelve el
-- acceso con el cliente-máquina (service-role). Idempotente. Aplicar en el
-- proyecto Supabase del PLANO DE TIENDA.
-- =============================================================================

-- ── Segmentos de clientes ────────────────────────────────────────────────────
create table if not exists public.customer_segments (
  id          bigserial    primary key,
  tenant_id   uuid         not null,
  name        text         not null,
  type        text         not null default 'manual',   -- 'manual' | 'rules'
  rules       jsonb        not null default '{}'::jsonb, -- { min_orders, min_total, within_days }
  created_at  timestamptz  not null default now(),
  updated_at  timestamptz  not null default now(),
  constraint customer_segments_type_chk check (type in ('manual', 'rules'))
);

create table if not exists public.customer_segment_members (
  id          bigserial    primary key,
  tenant_id   uuid         not null,
  segment_id  bigint       not null references public.customer_segments (id) on delete cascade,
  customer_id uuid         not null references public.customers (id) on delete cascade,
  added_at    timestamptz  not null default now()
);

create unique index if not exists segment_members_unique_idx
  on public.customer_segment_members (segment_id, customer_id);
create index if not exists segment_members_tenant_idx
  on public.customer_segment_members (tenant_id, segment_id);

-- ── Campañas VIP ─────────────────────────────────────────────────────────────
create table if not exists public.vip_campaigns (
  id            bigserial    primary key,
  tenant_id     uuid         not null,
  name          text         not null,
  segment_id    bigint       references public.customer_segments (id) on delete set null,
  starts_at     timestamptz  not null,
  ends_at       timestamptz  not null,
  -- Estado persistido de control manual; el estado efectivo se deriva también de
  -- la ventana (scheduled/active/ended) salvo pausa/cancelación.
  status        text         not null default 'scheduled', -- 'scheduled'|'active'|'ended'|'paused'|'cancelled'
  offer_percent int,                                        -- % de descuento de campaña (opcional)
  quota         int,                                        -- cupo total de unidades (opcional)
  created_at    timestamptz  not null default now(),
  updated_at    timestamptz  not null default now(),
  constraint vip_campaigns_status_chk check (status in ('scheduled','active','ended','paused','cancelled')),
  constraint vip_campaigns_window_chk check (ends_at > starts_at)
);

create index if not exists vip_campaigns_tenant_idx
  on public.vip_campaigns (tenant_id, starts_at desc);

create table if not exists public.vip_campaign_scope (
  id          bigserial  primary key,
  tenant_id   uuid       not null,
  campaign_id bigint     not null references public.vip_campaigns (id) on delete cascade,
  product_id  bigint     references public.products (id) on delete cascade,
  category_id bigint     references public.categories (id) on delete cascade,
  constraint vip_scope_target_chk check (num_nonnulls(product_id, category_id) = 1)
);

create index if not exists vip_scope_campaign_idx
  on public.vip_campaign_scope (campaign_id);
create index if not exists vip_scope_product_idx
  on public.vip_campaign_scope (tenant_id, product_id);

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.customer_segments        enable row level security;
alter table public.customer_segment_members enable row level security;
alter table public.vip_campaigns            enable row level security;
alter table public.vip_campaign_scope       enable row level security;

-- Gestión completa solo para el JWT del panel (is_admin=true) y su tenant.
do $$
declare t text;
begin
  foreach t in array array['customer_segments','customer_segment_members','vip_campaigns','vip_campaign_scope']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_admin_all', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (tenant_id = (auth.jwt() ->> ''tenant_id'')::uuid and coalesce((auth.jwt() ->> ''is_admin'')::boolean, false)) with check (tenant_id = (auth.jwt() ->> ''tenant_id'')::uuid and coalesce((auth.jwt() ->> ''is_admin'')::boolean, false))',
      t || '_admin_all', t
    );
  end loop;
end $$;
