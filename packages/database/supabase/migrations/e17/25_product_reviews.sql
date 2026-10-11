-- =============================================================================
-- E17 · HU-101 — Reseñas y calificaciones de producto
-- =============================================================================
-- Reseñas moderadas: el comprador (anon/authenticated con JWT de tenant) crea la
-- reseña en estado `pending`; el público solo ve las `approved`; el admin
-- (is_admin) modera (approve/reject/delete). RLS por tenant.
-- Idempotente. Aplicar en el proyecto Supabase del PLANO DE TIENDA.
-- =============================================================================

create table if not exists public.product_reviews (
  id          serial       primary key,
  tenant_id   uuid         not null,
  product_id  int          not null,
  customer_id uuid,                                   -- opcional (invitado = null)
  author_name text         not null,
  rating      int          not null check (rating between 1 and 5),
  title       text,
  body        text,
  status      text         not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at  timestamptz  not null default now()
);

-- FK compuesta con tenant (patrón e17/04). Borra reseñas si se borra el producto.
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'product_reviews_product_fk'
  ) then
    alter table public.product_reviews
      add constraint product_reviews_product_fk
      foreign key (product_id, tenant_id)
      references public.products (id, tenant_id) on delete cascade;
  end if;
end $$;

create index if not exists product_reviews_lookup_idx
  on public.product_reviews (tenant_id, product_id, status);

alter table public.product_reviews enable row level security;

-- Lectura pública: solo reseñas APROBADAS del tenant.
drop policy if exists product_reviews_tenant_read on public.product_reviews;
create policy product_reviews_tenant_read on public.product_reviews
  for select to anon, authenticated
  using (status = 'approved' and tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Alta pública: el comprador puede crear, SIEMPRE en estado 'pending' y en su tenant.
drop policy if exists product_reviews_public_insert on public.product_reviews;
create policy product_reviews_public_insert on public.product_reviews
  for insert to anon, authenticated
  with check (status = 'pending' and tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Moderación: CRUD total solo para el JWT del panel (is_admin=true) y su tenant.
drop policy if exists product_reviews_admin_all on public.product_reviews;
create policy product_reviews_admin_all on public.product_reviews
  for all to authenticated
  using      (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid and coalesce((auth.jwt() ->> 'is_admin')::boolean, false))
  with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid and coalesce((auth.jwt() ->> 'is_admin')::boolean, false));
