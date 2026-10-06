-- =============================================================================
-- E17 · HU-270 — Catálogo server-side: denormalización de precio + índice de facetas
-- =============================================================================
-- Para poder ORDENAR y PAGINAR por precio en BD (el precio vive en las variantes,
-- no en products) denormalizamos el rango de precio por producto:
--   products.min_price / products.max_price  (centavos; NULL si no hay variantes activas)
-- mantenido por un TRIGGER sobre product_variants (insert/update/delete).
-- Y para FILTRAR por atributos (color/talla) server-side, un índice GIN sobre
-- product_variants.attributes (JSONB).
-- Idempotente. Aplicar en el proyecto Supabase de admin/web (plano de tienda).
-- =============================================================================

alter table public.products
  add column if not exists min_price integer,
  add column if not exists max_price integer;

-- Índice para ordenar/paginar por precio (NULLs al final en ASC).
create index if not exists products_min_price_idx on public.products (min_price);

-- Índice GIN para filtrar por atributos de variante (JSONB containment @>).
create index if not exists product_variants_attributes_gin
  on public.product_variants using gin (attributes);

-- ── Trigger: recalcula el rango de precio del producto desde sus variantes ACTIVAS ──
create or replace function public.trg_recompute_product_prices()
returns trigger
language plpgsql
as $$
declare
  pid integer := coalesce(NEW.product_id, OLD.product_id);
  tid uuid    := coalesce(NEW.tenant_id, OLD.tenant_id);
begin
  update public.products p
     set min_price = sub.minp,
         max_price = sub.maxp
    from (
      select min(price)::int as minp, max(price)::int as maxp
        from public.product_variants
       where product_id = pid
         and tenant_id  = tid
         and active = true
    ) sub
   where p.id = pid
     and p.tenant_id = tid;
  return null; -- AFTER trigger
end;
$$;

drop trigger if exists product_variants_price_range on public.product_variants;
create trigger product_variants_price_range
  after insert or update or delete on public.product_variants
  for each row execute function public.trg_recompute_product_prices();

-- ── Backfill del rango de precio para el catálogo existente ────────────────────
update public.products p
   set min_price = sub.minp,
       max_price = sub.maxp
  from (
    select product_id, tenant_id, min(price)::int as minp, max(price)::int as maxp
      from public.product_variants
     where active = true
     group by product_id, tenant_id
  ) sub
 where p.id = sub.product_id
   and p.tenant_id = sub.tenant_id;
