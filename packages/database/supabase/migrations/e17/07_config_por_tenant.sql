-- =============================================================================
-- E17 · HU-207 — Config por tenant (singletons → fila-por-tenant)
-- =============================================================================
-- Los singletons de config (store/payment/admin/shipping) ya tienen `tenant_id`
-- (e17/01) y se les quitó el CHECK id=1 (e17/03). Esta migración:
--   1. Garantiza UNICIDAD por tenant (una fila de config por tenant) → habilita
--      leer/upsert por `tenant_id`.
--   2. RLS: `store_config` es info PÚBLICA de la tienda → lectura anon acotada por
--      tenant. `payment_config`/`admin_config`/`shipping_config` tienen SECRETOS/
--      datos internos → RLS habilitado SIN política anon (solo service-role).
--
-- Idempotente. Aplicar en el proyecto Supabase del PLANO DE TIENDA.
-- =============================================================================

-- 1) Unicidad por tenant (una config por tenant)
create unique index if not exists store_config_tenant_uk    on public.store_config    (tenant_id);
create unique index if not exists payment_config_tenant_uk  on public.payment_config  (tenant_id);
create unique index if not exists admin_config_tenant_uk    on public.admin_config    (tenant_id);
create unique index if not exists shipping_config_tenant_uk on public.shipping_config (tenant_id);

-- 2a) store_config: lectura anon/authenticated acotada por tenant (info pública)
alter table public.store_config enable row level security;
drop policy if exists store_config_tenant_read on public.store_config;
create policy store_config_tenant_read on public.store_config
  for select to anon, authenticated
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- 2b) Config con secretos / interna: RLS habilitado SIN política → solo service-role
--     (checkout/admin leen con service-role; anon nunca ve credenciales de pasarela).
alter table public.payment_config  enable row level security;
alter table public.admin_config    enable row level security;
alter table public.shipping_config enable row level security;
-- (sin `create policy`: deny-by-default para anon/authenticated; service-role omite RLS)

-- =============================================================================
-- Rollback:
--   drop policy if exists store_config_tenant_read on public.store_config;
--   drop index if exists store_config_tenant_uk, payment_config_tenant_uk,
--                        admin_config_tenant_uk, shipping_config_tenant_uk;
--   (y, si aplica, deshabilitar RLS en esas tablas)
-- =============================================================================
