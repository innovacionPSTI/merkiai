-- =============================================================================
-- E17 · HU-356 — Bloques globales / partials reutilizables
-- =============================================================================
-- Un "partial" es una PÁGINA del CMS (p. ej. `page_type='partial'`) que se edita
-- una sola vez; el bloque `partial_ref` la referencia por `key` desde N páginas,
-- y el renderer inyecta sus secciones. Un cambio en el partial se refleja en
-- todas. Reusa páginas → borrador/preview (HU-128) y portabilidad (HU-123) gratis.
-- Amplía el CHECK de `page_sections.section_type`. Idempotente. Plano de tienda.
-- =============================================================================

alter table public.page_sections
  drop constraint if exists page_sections_section_type_check;

alter table public.page_sections
  add constraint page_sections_section_type_check
  check (section_type in (
    'hero','text','cards','faq','cta','testimonials',
    'whatsapp','services','featured_products','best_sellers',
    'historia','blog_preview','newsletter',
    'content_section','columns','media_banner','spacer',
    'product_carousel','collection_list',
    -- HU-356 · referencia a un partial (página reutilizable)
    'partial_ref'
  ));
