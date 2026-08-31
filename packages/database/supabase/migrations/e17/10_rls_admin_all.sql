-- =============================================================================
-- E17 · HU-158 (Etapa 3) — Políticas RLS del PANEL ADMIN para el resto de tablas
-- =============================================================================
-- Extiende e17/09 (piloto productos) a todas las tablas que gestiona el admin.
-- Cada tabla con `tenant_id` recibe `<tabla>_admin_all` (FOR ALL TO authenticated)
-- que da CRUD SOLO sobre las filas de SU tenant al JWT del panel (is_admin=true).
--
-- ADITIVAS (RLS permisiva): conviven con las de storefront/comprador. Un
-- comprador (authenticated sin is_admin) NO gana escritura.
--
-- Robusto e idempotente: recorre la lista y solo aplica a las que tienen
-- `tenant_id` (salta las que no). Aplicar en el Supabase de admin/web.
-- =============================================================================

do $$
declare
  t text;
  has_tenant boolean;
  tables text[] := array[
    'orders','customers','customer_addresses','profiles',
    'pages','page_sections','section_items','blog_posts','nav_items',
    'coupons','testimonials','themes','media_assets','banners',
    'newsletter_subscribers','shipping_profiles',
    'store_config','payment_config','admin_config','shipping_config'
  ];
begin
  foreach t in array tables loop
    select exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = t and column_name = 'tenant_id'
    ) into has_tenant;

    if has_tenant then
      execute format('alter table public.%I enable row level security', t);
      execute format('drop policy if exists %I on public.%I', t || '_admin_all', t);
      execute format(
        'create policy %I on public.%I for all to authenticated '
        'using (tenant_id = (auth.jwt()->>''tenant_id'')::uuid and coalesce((auth.jwt()->>''is_admin'')::boolean, false)) '
        'with check (tenant_id = (auth.jwt()->>''tenant_id'')::uuid and coalesce((auth.jwt()->>''is_admin'')::boolean, false))',
        t || '_admin_all', t
      );
    else
      raise notice 'skip %: sin columna tenant_id', t;
    end if;
  end loop;
end $$;
