-- =============================================================================
-- E17 · HU-252 — Bloques genéricos de layout
-- =============================================================================
-- Amplía el CHECK de `page_sections.section_type` para admitir los nuevos
-- bloques de composición libre que destraban el diseño sin ir a canvas freeform:
--   content_section → encabezado + texto rico + imagen + botón + disposición
--   columns         → N columnas con ítems {icono/imagen, título, texto, enlace}
--   media_banner    → imagen/video full-bleed + overlay de texto + CTA
--   spacer          → separador/espaciador
-- `section_items.item_type` no tiene CHECK, así que el nuevo item_type 'column'
-- no requiere migración de esa tabla.
-- Idempotente. Aplicar en el proyecto Supabase de admin/web (plano de tienda).
-- =============================================================================

alter table public.page_sections
  drop constraint if exists page_sections_section_type_check;

alter table public.page_sections
  add constraint page_sections_section_type_check
  check (section_type in (
    'hero','text','cards','faq','cta','testimonials',
    'whatsapp','services','featured_products','best_sellers',
    'historia','blog_preview','newsletter',
    -- HU-252 · bloques genéricos
    'content_section','columns','media_banner','spacer'
  ));
