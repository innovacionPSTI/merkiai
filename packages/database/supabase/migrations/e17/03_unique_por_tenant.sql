-- =============================================================================
-- E17 · HU-156 — Corrección de integridad #1: UNIQUE por tenant + singletons
-- =============================================================================
-- Convierte las restricciones UNIQUE globales de claves de negocio en UNIQUE
-- POR TENANT `(tenant_id, <clave>)`, para que dos tenants puedan repetir el
-- mismo slug/email/code/key. Y relaja los singletons de config a una fila por
-- tenant. Ver docs/HU-156-integridad-referencial-multitenant.md.
--
-- Alcance SEGURO: solo toca uniques secundarios (la PK surrogate id/uuid no
-- cambia) y los singletons de config. NO toca las FK ni las PK de clave natural
-- (`pages.key`, `media_assets.key`) — eso va en e17/04 (más delicado).
--
-- Idempotente. **Aplicar primero en STAGING.** Proyecto Supabase del plano de tienda.
-- Requiere e17/01_tenant_id.sql aplicado.
-- =============================================================================

-- ─── Parte A · UNIQUE por tenant en claves de negocio ────────────────────────
-- Reemplaza `<tabla>_<col>_key` (global) por `<tabla>_<col>_tenant_uk`.
do $$
declare
  p text[];
  -- (tabla, columna) con UNIQUE global de negocio.
  pairs text[] := array[
    'profiles','email',
    'customers','email',
    'customers','stack_id',
    'categories','name',
    'categories','slug',
    'products','slug',
    'product_variants','sku',
    'coupons','code',
    'blog_posts','slug',
    'pages','slug',
    'nav_items','nav_key',
    'newsletter_subscribers','email',
    'shipping_profiles','email',
    'orders','order_number'
  ];
  i int;
  tbl text;
  col text;
  old_name text;
  new_name text;
begin
  i := 1;
  while i < array_length(pairs, 1) loop
    tbl := pairs[i];
    col := pairs[i + 1];
    old_name := tbl || '_' || col || '_key';        -- nombre por defecto de Postgres
    new_name := tbl || '_' || col || '_tenant_uk';

    -- Quitar el UNIQUE global (si existe con el nombre por defecto).
    execute format('alter table public.%I drop constraint if exists %I', tbl, old_name);

    -- Añadir el UNIQUE compuesto por tenant (idempotente).
    if not exists (select 1 from pg_constraint where conname = new_name) then
      execute format(
        'alter table public.%I add constraint %I unique (tenant_id, %I)',
        tbl, new_name, col
      );
    end if;

    i := i + 2;
  end loop;
end $$;

-- page_sections.section_key era un UNIQUE INDEX, no una constraint.
drop index if exists page_sections_section_key_idx;
create unique index if not exists page_sections_section_key_tenant_idx
  on public.page_sections (tenant_id, section_key);

-- ─── Parte B · Singletons de config → una fila por tenant ────────────────────
-- Quita el mecanismo singleton y garantiza unicidad por tenant. La app aún lee
-- por `id = 1` (fila del tenant por defecto); las lecturas por tenant se cablean
-- después. Aquí solo se relaja el esquema (no rompe la lectura actual).
alter table public.store_config    drop constraint if exists store_config_singleton;
alter table public.payment_config  drop constraint if exists payment_config_singleton;
alter table public.admin_config    drop constraint if exists admin_config_singleton;
drop index if exists shipping_config_singleton_idx;

do $$
declare
  t text;
  cfg text[] := array['store_config','payment_config','shipping_config','admin_config'];
begin
  foreach t in array cfg loop
    if not exists (select 1 from pg_constraint where conname = t || '_tenant_uk') then
      execute format('alter table public.%I add constraint %I unique (tenant_id)', t, t || '_tenant_uk');
    end if;
  end loop;
end $$;

-- ─── Verificación (correr manualmente tras aplicar) ──────────────────────────
-- Nuevos uniques por tenant:
--   select conname from pg_constraint where conname like '%_tenant_uk' order by 1;
-- Que ya no queden los globales por defecto (deben devolver 0 filas):
--   select conname from pg_constraint
--     where conname in ('products_slug_key','coupons_code_key','customers_email_key');

-- =============================================================================
-- SIGUIENTE (e17/04, pasada delicada — NO en este archivo):
--   · UNIQUE (id, tenant_id) en padres (categories, products, product_variants,
--     customers, pages, page_sections) + FK COMPUESTAS con tenant_id en hijos.
--   · PK de clave natural por tenant: pages.key y media_assets.key
--     (requiere ajustar las FK que apuntan a pages.key).
--   · Chequeo de integridad de tenant_id huérfanos.
-- =============================================================================
