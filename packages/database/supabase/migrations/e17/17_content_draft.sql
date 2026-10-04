-- =============================================================================
-- E17 · HU-128 v2 — Borrador de contenido ya publicado (editar en caliente)
-- =============================================================================
-- v1 (Opción A) permitía construir con filas `enabled=false` y previsualizarlas
-- antes de publicar. Pero una vez publicada (`enabled=true`), editar la sección
-- tocaba el contenido EN VIVO (el visitante veía los cambios al instante).
--
-- v2 añade una columna `draft` (JSONB) a `page_sections` y `section_items`:
--   • Guarda un OVERLAY parcial de las columnas editables (p. ej.
--     { "title": "...", "settings": {...}, "enabled": true }).
--   • El público NUNCA ve `draft` (lee las columnas en vivo).
--   • La vista previa (cliente-máquina is_admin, HU-128) fusiona `draft` sobre
--     la fila, así el comerciante edita "en caliente" sin exponer los cambios.
--   • "Publicar cambios" copia el overlay a las columnas en vivo y limpia draft.
--   • "Descartar" pone draft = NULL.
-- NULL = sin cambios pendientes. Las filas existentes no cambian de conducta.
-- Idempotente. Aplicar en el proyecto Supabase de admin/web (plano de tienda).
-- =============================================================================

alter table public.page_sections add column if not exists draft jsonb;
alter table public.section_items add column if not exists draft jsonb;
