-- =============================================================================
-- E17 · HU-372 — Header y Footer como REGIONES editables (chrome por partials)
-- =============================================================================
-- El encabezado y el pie del storefront pasan a poder construirse con bloques,
-- igual que cualquier página. Para ello reservamos dos PÁGINAS del CMS por
-- tenant que actúan como "regiones":
--   · region_header → bloques del encabezado
--   · region_footer → bloques del pie
--
-- Son páginas normales (se editan en el Constructor como el resto), pero:
--   · page_type = 'region'  → el Constructor las etiqueta y NO se crean desde el
--     wizard (son reservadas); el router público las ignora (defensa en server).
--   · enabled = false       → nunca son enrutables por su slug (doble candado con
--     el guard de page_type en la ruta [slug]). El chrome NO depende de este flag:
--     lee `page_sections` directo por page_key (sus secciones sí llevan enabled).
--   · slug reservado         → 'region-header' / 'region-footer' (único por tenant).
--
-- El storefront solo CONSUME estas regiones cuando el plan tiene la feature
-- `editable_chrome` (HU-359) **y** la región tiene secciones; si no, cae al
-- Navbar/Footer actuales (config-driven) → CERO REGRESIÓN.
--
-- Scoped por tenant (una fila por tenant existente). Idempotente
-- (ON CONFLICT (tenant_id, key) DO NOTHING). PK compuesta = (tenant_id, key).
-- Aplicar en el proyecto Supabase del PLANO DE TIENDA.
-- =============================================================================

-- Encabezado
insert into public.pages (tenant_id, key, label, slug, page_type, enabled, show_in_footer, order_index)
select p.tenant_id, 'region_header', 'Región · Encabezado', 'region-header', 'region', false, false, 100
  from (select distinct tenant_id from public.pages) p
 on conflict (tenant_id, key) do nothing;

-- Pie de página
insert into public.pages (tenant_id, key, label, slug, page_type, enabled, show_in_footer, order_index)
select p.tenant_id, 'region_footer', 'Región · Pie de página', 'region-footer', 'region', false, false, 101
  from (select distinct tenant_id from public.pages) p
 on conflict (tenant_id, key) do nothing;

-- =============================================================================
-- Rollback (si hiciera falta retirar las regiones):
--   delete from public.page_sections where page_key in ('region_header','region_footer');
--   delete from public.pages        where key      in ('region_header','region_footer');
-- (El chrome vuelve solo al Navbar/Footer config-driven al no hallar secciones.)
-- =============================================================================
