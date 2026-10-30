-- =============================================================================
-- E17 · HU-354 AC-1 — Plantilla por tipo construida en el lienzo
-- =============================================================================
-- Una colección puede apuntar a una PÁGINA del CMS (por `key`) que actúa como
-- su plantilla de registro: sus bloques usan *placeholders* `{{campo}}` que se
-- sustituyen con los valores del registro al renderizar `/[colección]/[slug]`.
-- Sin `template_page_key`, el registro usa la plantilla automática (HU-354 render).
-- Aditiva, nullable, opt-in → cero regresión. Aplicar en el plano de tienda.
-- =============================================================================

alter table public.collections
  add column if not exists template_page_key text;
