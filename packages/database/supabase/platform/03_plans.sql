-- =============================================================================
-- E17 · HU-173 — Planes y entitlements (BD de PLATAFORMA)
-- =============================================================================
-- Catálogo de planes con su matriz de funcionalidades (features) y límites.
-- El plan de un tenant (`tenants.plan`) referencia este catálogo. Los
-- entitlements derivan de `features`/`limits` (gating en UI + API).
-- Idempotente. Aplicar en el proyecto Supabase de PLATAFORMA. Requiere 01_platform_schema.
-- =============================================================================

create table if not exists public.plans (
  key             text primary key,               -- 'free' | 'pro' | 'enterprise' | …
  name            text not null,
  price_cents     integer not null default 0,
  currency        text not null default 'COP',
  -- Funcionalidades habilitadas: { "pos": true, "custom_domain": false, "ai": true, … }
  features        jsonb not null default '{}',
  -- Límites cuantitativos: { "products": 100, "users": 3, "orders_month": 1000 }
  limits          jsonb not null default '{}',
  -- Nivel de aislamiento de datos por defecto del plan (HU-200).
  data_isolation  text not null default 'shared'
                  check (data_isolation in ('shared','schema','dedicated')),
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);

alter table public.plans enable row level security;  -- solo control plane (service-role)

-- Seed de planes base (ajustar features/limits al modelo comercial real).
insert into public.plans (key, name, price_cents, features, limits, data_isolation) values
  ('free',       'Free',        0,
     '{"pos": false, "custom_domain": false, "ai": false, "dropshipping": false}',
     '{"products": 50, "users": 2, "orders_month": 200}', 'shared'),
  ('pro',        'Pro',         9900000,
     '{"pos": true, "custom_domain": true, "ai": true, "dropshipping": false}',
     '{"products": 2000, "users": 10, "orders_month": 20000}', 'shared'),
  ('enterprise', 'Enterprise',  0,
     '{"pos": true, "custom_domain": true, "ai": true, "dropshipping": true}',
     '{"products": null, "users": null, "orders_month": null}', 'dedicated')
on conflict (key) do nothing;

-- FK: el plan del tenant debe existir en el catálogo (misma BD de plataforma).
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'tenants_plan_fk') then
    alter table public.tenants
      add constraint tenants_plan_fk foreign key (plan) references public.plans (key);
  end if;
end $$;
