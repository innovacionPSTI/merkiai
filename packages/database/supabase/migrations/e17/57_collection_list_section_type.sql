-- =============================================================================
-- E17 · HU-355 — Bloque "Listado de colección" (listado dinámico)
-- =============================================================================
-- Amplía el CHECK de `page_sections.section_type` para admitir el nuevo bloque
-- `collection_list`, que lista registros de una colección (HU-353) en cualquier
-- página. La configuración (colección/orden/filtro/límite) vive en `settings`;
-- no requiere columnas nuevas. Generaliza `product_carousel` a cualquier tipo
-- de contenido. Idempotente. Aplicar en el plano de tienda (admin/web).
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
    'product_carousel',
    -- HU-355 · listado dinámico de colección
    'collection_list'
  ));
