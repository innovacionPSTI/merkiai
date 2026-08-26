-- =============================================================================
-- E17 · HU-156 — Corrección de integridad #2: FK compuestas con tenant_id
-- =============================================================================
-- Evita la fuga referencial cross-tenant: hoy un hijo del tenant A podría
-- referenciar un padre del tenant B (la FK solo valida el id). Se añade
-- UNIQUE (id, tenant_id) en los padres y se recrean las FK como COMPUESTAS
-- (col, tenant_id) -> parent(id, tenant_id). Además, pages.key y media_assets.key
-- pasan a ser únicos POR TENANT (PK compuesta).
--
-- Idempotente (patrón: drop-new-if-exists -> add). **Aplicar en STAGING primero.**
-- Requiere e17/01 y e17/03 aplicados. Proyecto Supabase del plano de tienda.
-- ⚠️ Ejecutar en una ventana de bajo tráfico: recrea PK/FK de contenido.
-- =============================================================================

-- ─── 1. UNIQUE (id, tenant_id) en padres con PK surrogate ────────────────────
do $$
declare
  t text;
  parents text[] := array[
    'categories','products','product_variants','customers','profiles',
    'page_sections','nav_items'
  ];
begin
  foreach t in array parents loop
    execute format('alter table public.%I drop constraint if exists %I', t, t || '_id_tenant_uk');
    execute format('alter table public.%I add  constraint %I unique (id, tenant_id)', t, t || '_id_tenant_uk');
  end loop;
end $$;

-- ─── 2. FK compuestas (surrogate) — drop global, add (col, tenant_id) ────────
-- products.category_id -> categories
alter table public.products drop constraint if exists products_category_tenant_fk;
alter table public.products drop constraint if exists products_category_id_fkey;
alter table public.products
  add constraint products_category_tenant_fk
  foreign key (category_id, tenant_id) references public.categories (id, tenant_id) on delete set null;

-- product_variants.product_id -> products
alter table public.product_variants drop constraint if exists product_variants_product_tenant_fk;
alter table public.product_variants drop constraint if exists product_variants_product_id_fkey;
alter table public.product_variants
  add constraint product_variants_product_tenant_fk
  foreign key (product_id, tenant_id) references public.products (id, tenant_id) on delete cascade;

-- orders.customer_id -> customers (nullable, guest checkout)
alter table public.orders drop constraint if exists orders_customer_tenant_fk;
alter table public.orders drop constraint if exists orders_customer_id_fkey;
alter table public.orders
  add constraint orders_customer_tenant_fk
  foreign key (customer_id, tenant_id) references public.customers (id, tenant_id) on delete set null;

-- cart_items.{customer_id, variant_id, product_id}
alter table public.cart_items drop constraint if exists cart_items_customer_tenant_fk;
alter table public.cart_items drop constraint if exists cart_items_customer_id_fkey;
alter table public.cart_items
  add constraint cart_items_customer_tenant_fk
  foreign key (customer_id, tenant_id) references public.customers (id, tenant_id) on delete cascade;

alter table public.cart_items drop constraint if exists cart_items_variant_tenant_fk;
alter table public.cart_items drop constraint if exists cart_items_variant_id_fkey;
alter table public.cart_items
  add constraint cart_items_variant_tenant_fk
  foreign key (variant_id, tenant_id) references public.product_variants (id, tenant_id) on delete cascade;

alter table public.cart_items drop constraint if exists cart_items_product_tenant_fk;
alter table public.cart_items drop constraint if exists cart_items_product_id_fkey;
alter table public.cart_items
  add constraint cart_items_product_tenant_fk
  foreign key (product_id, tenant_id) references public.products (id, tenant_id) on delete cascade;

-- customer_addresses.customer_id -> customers
alter table public.customer_addresses drop constraint if exists customer_addresses_customer_tenant_fk;
alter table public.customer_addresses drop constraint if exists customer_addresses_customer_id_fkey;
alter table public.customer_addresses
  add constraint customer_addresses_customer_tenant_fk
  foreign key (customer_id, tenant_id) references public.customers (id, tenant_id) on delete cascade;

-- section_items.section_id -> page_sections
alter table public.section_items drop constraint if exists section_items_section_tenant_fk;
alter table public.section_items drop constraint if exists section_items_section_id_fkey;
alter table public.section_items
  add constraint section_items_section_tenant_fk
  foreign key (section_id, tenant_id) references public.page_sections (id, tenant_id) on delete cascade;

-- nav_items.parent_id -> nav_items (self-ref)
alter table public.nav_items drop constraint if exists nav_items_parent_tenant_fk;
alter table public.nav_items drop constraint if exists nav_items_parent_id_fkey;
alter table public.nav_items
  add constraint nav_items_parent_tenant_fk
  foreign key (parent_id, tenant_id) references public.nav_items (id, tenant_id) on delete cascade;

-- media_assets.uploaded_by -> profiles
alter table public.media_assets drop constraint if exists media_assets_uploaded_by_tenant_fk;
alter table public.media_assets drop constraint if exists media_assets_uploaded_by_fkey;
alter table public.media_assets
  add constraint media_assets_uploaded_by_tenant_fk
  foreign key (uploaded_by, tenant_id) references public.profiles (id, tenant_id) on delete set null;

-- blog_posts.author_id -> profiles
alter table public.blog_posts drop constraint if exists blog_posts_author_tenant_fk;
alter table public.blog_posts drop constraint if exists blog_posts_author_id_fkey;
alter table public.blog_posts
  add constraint blog_posts_author_tenant_fk
  foreign key (author_id, tenant_id) references public.profiles (id, tenant_id) on delete set null;

-- ─── 3. pages.key -> PK compuesta (tenant_id, key) + FK dependientes ─────────
-- Permite que dos tenants tengan la misma page key (p. ej. 'home').
do $$
begin
  -- Quitar FKs dependientes (nombres nuevos y por defecto).
  alter table public.page_sections drop constraint if exists page_sections_page_tenant_fk;
  alter table public.page_sections drop constraint if exists page_sections_page_key_fkey;
  alter table public.nav_items      drop constraint if exists nav_items_page_tenant_fk;
  alter table public.nav_items      drop constraint if exists nav_items_page_key_fkey;

  -- Cambiar PK de pages a (tenant_id, key) si aún no lo es.
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.pages'::regclass and contype = 'p'
      and (select array_agg(attname::text order by attnum) from pg_attribute
           where attrelid = 'public.pages'::regclass and attnum = any(conkey)) = array['key']
  ) then
    alter table public.pages drop constraint pages_pkey;
    alter table public.pages add  constraint pages_pkey primary key (tenant_id, key);
  end if;

  -- Recrear FKs como compuestas.
  alter table public.page_sections
    add constraint page_sections_page_tenant_fk
    foreign key (tenant_id, page_key) references public.pages (tenant_id, key) on delete cascade;
  alter table public.nav_items
    add constraint nav_items_page_tenant_fk
    foreign key (tenant_id, page_key) references public.pages (tenant_id, key) on delete set null;
end $$;

-- ─── 4. media_assets.key -> PK compuesta (tenant_id, key) ────────────────────
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.media_assets'::regclass and contype = 'p'
      and (select array_agg(attname::text order by attnum) from pg_attribute
           where attrelid = 'public.media_assets'::regclass and attnum = any(conkey)) = array['key']
  ) then
    alter table public.media_assets drop constraint media_assets_pkey;
    alter table public.media_assets add  constraint media_assets_pkey primary key (tenant_id, key);
  end if;
end $$;

-- ─── 5. Verificación / chequeo de integridad (correr tras aplicar) ───────────
-- FKs compuestas creadas:
--   select conname from pg_constraint where conname like '%_tenant_fk' order by 1;
-- Referencias cross-tenant residuales (debe devolver 0 en cada una):
--   select count(*) from products p join categories c on c.id=p.category_id where c.tenant_id<>p.tenant_id;
--   select count(*) from product_variants v join products p on p.id=v.product_id where p.tenant_id<>v.tenant_id;
--   select count(*) from orders o join customers c on c.id=o.customer_id where c.tenant_id<>o.tenant_id;
-- tenant_id sin tenant en la BD de plataforma: verificar contra el registro `tenants`.
