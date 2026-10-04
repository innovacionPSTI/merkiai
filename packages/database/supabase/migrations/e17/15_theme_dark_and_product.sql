-- =============================================================================
-- E17 · HU-247 — Tema claro/oscuro + color de producto
-- =============================================================================
-- Completa el sistema de Temas del storefront:
--   • color_scheme: 'light' (solo claro, default), 'auto' (sigue el SO vía
--     prefers-color-scheme) o 'dark' (forzado oscuro).
--   • dark_bg / dark_surface / dark_text: paleta oscura (fondo, superficie,
--     texto). Se emiten como override de --brand-cream / --brand-cream-warm /
--     --brand-text cuando el modo oscuro aplica. NULL → defaults cálidos.
--   • color_price: color del precio en las vistas de producto (--brand-price);
--     NULL → usa el primario.
-- Todo nullable/con default: los temas existentes no cambian de conducta.
-- Idempotente. Aplicar en el proyecto Supabase de admin/web (plano de tienda).
-- =============================================================================

alter table public.themes
  add column if not exists color_scheme text not null default 'light',
  add column if not exists dark_bg      text,
  add column if not exists dark_surface text,
  add column if not exists dark_text    text,
  add column if not exists color_price  text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'themes_color_scheme_check'
  ) then
    alter table public.themes
      add constraint themes_color_scheme_check
      check (color_scheme in ('light','auto','dark'));
  end if;
end$$;
