-- =============================================================================
-- E17 · HU-103 v2 — Lista de deseos por cuenta
-- =============================================================================
-- Persiste los favoritos del comprador logueado en BD (antes solo localStorage).
-- Propiedad del cliente vía RLS (patrón e17/05: customer_id ∈ los del stack_id
-- del JWT). El invitado sigue en localStorage y al iniciar sesión se fusiona.
-- Idempotente. Aplicar en el proyecto Supabase del PLANO DE TIENDA.
-- =============================================================================

create table if not exists public.wishlist_items (
  id          serial       primary key,
  tenant_id   uuid         not null,
  customer_id uuid         not null,
  product_id  int          not null,
  created_at  timestamptz  not null default now()
);

-- FK compuesta con tenant (patrón e17/04). Borra el favorito si se borra el producto.
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'wishlist_items_product_fk') then
    alter table public.wishlist_items
      add constraint wishlist_items_product_fk
      foreign key (product_id, tenant_id)
      references public.products (id, tenant_id) on delete cascade;
  end if;
end $$;

-- Un favorito por (tenant, cliente, producto).
create unique index if not exists wishlist_items_unique
  on public.wishlist_items (tenant_id, customer_id, product_id);

alter table public.wishlist_items enable row level security;

-- Propiedad del cliente: ve/edita solo sus favoritos (customer del stack_id del JWT).
drop policy if exists wishlist_own on public.wishlist_items;
create policy wishlist_own on public.wishlist_items for all to authenticated
  using      (tenant_id = (auth.jwt()->>'tenant_id')::uuid
              and customer_id in (select id from public.customers
                                  where stack_id = auth.jwt()->>'sub'
                                    and tenant_id = (auth.jwt()->>'tenant_id')::uuid))
  with check (tenant_id = (auth.jwt()->>'tenant_id')::uuid
              and customer_id in (select id from public.customers
                                  where stack_id = auth.jwt()->>'sub'
                                    and tenant_id = (auth.jwt()->>'tenant_id')::uuid));
