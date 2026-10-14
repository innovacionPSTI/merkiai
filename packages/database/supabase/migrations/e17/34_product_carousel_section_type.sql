-- =============================================================================
-- E17 · HU-286 v2 — Bloque "Carrusel de productos" (cross-sell / recomendaciones)
-- =============================================================================
-- Amplía el CHECK de `page_sections.section_type` para admitir el nuevo bloque
-- reutilizable `product_carousel`, insertable por el Constructor en cualquier
-- página. La fuente (destacados/más vendidos/nuevos/categoría/manual) vive en
-- `settings`; no requiere columnas nuevas.
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
    'content_section','columns','media_banner','spacer',
    -- HU-286 v2 · carrusel de productos
    'product_carousel'
  ));
