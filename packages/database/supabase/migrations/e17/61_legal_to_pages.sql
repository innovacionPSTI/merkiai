-- =============================================================================
-- E17 · HU-370 — Legal como páginas del Constructor (fuente única)
-- =============================================================================
-- El storefront ya prefiere el contenido de las PÁGINAS `terms`/`privacy` sobre
-- `store_config.terms_content/privacy_content` (fallback). Esta migración lleva
-- el contenido legacy de `store_config` al cuerpo del bloque de texto de esas
-- páginas **cuando aún está vacío**, para que el Constructor sea la única
-- superficie de edición y se pueda retirar "Configuración → Legal".
--
-- Scoped por tenant (ambas tablas tienen tenant_id). Idempotente (solo rellena
-- cuerpos vacíos). No borra `store_config.*_content` (queda como respaldo inerte).
-- Aplicar en el plano de tienda.
-- =============================================================================

-- Términos
update public.page_sections ps
   set body = sc.terms_content,
       updated_at = now()
  from public.store_config sc
 where ps.tenant_id = sc.tenant_id
   and ps.page_key = 'terms'
   and ps.section_type = 'text'
   and coalesce(ps.body, '') = ''
   and coalesce(sc.terms_content, '') <> '';

-- Privacidad
update public.page_sections ps
   set body = sc.privacy_content,
       updated_at = now()
  from public.store_config sc
 where ps.tenant_id = sc.tenant_id
   and ps.page_key = 'privacy'
   and ps.section_type = 'text'
   and coalesce(ps.body, '') = ''
   and coalesce(sc.privacy_content, '') <> '';
