/**
 * queries/blueprint.ts — "Blueprint de sitio" (HU-373).
 *
 * Un *site blueprint* es un preset que, además del tema/home, crea una
 * **estructura de sitio** completa: varias **páginas** (con sus secciones), el
 * **menú** de navegación (padre/hijo, 1 nivel) y las **regiones** de chrome
 * (header/footer, HU-372). Permite ofrecer "estructuras de sitio" seleccionables
 * por plan en vez de solo la portada.
 *
 * Diseño:
 *  - `normalizeBlueprint` es **pura** (sin BD): slugifica/valida claves, descarta
 *    vacíos, deduplica páginas por `key` y recorta nº de páginas al tope del plan.
 *    Testeable de forma aislada.
 *  - `seedBlueprint` aplica el blueprint de forma **idempotente** con service-role
 *    (fija `tenant_id` en cada escritura, no pasa por RLS):
 *      · Páginas: crea solo las que aún no existen (PK compuesta tenant_id,key);
 *        siembra sus secciones solo si la página no tiene ninguna.
 *      · Nav: solo si el tenant aún no tiene ítems (no pisa un menú ya editado).
 *      · Regiones: asegura las páginas reservadas region_header/region_footer
 *        (HU-372) y siembra sus bloques solo si están vacías.
 *  - **Gating (HU-359)**: el llamador resuelve `site_blueprints` y solo entonces
 *    pasa el blueprint; sin la feature no se aplica nada → cero regresión.
 *
 * No toca catálogo (productos/categorías) ni pisa contenido ya editado por el
 * comerciante. Reutiliza el formato `StarterSection` de seed.ts.
 */
import type { StarterSection } from './seed'

/** Página de un blueprint (estructura + secciones de arranque). */
export interface BlueprintPage {
  key: string
  label: string
  slug?: string
  page_type?: string
  enabled?: boolean
  show_in_footer?: boolean
  order_index?: number
  sections?: StarterSection[]
}

/** Ítem de navegación de un blueprint (1 nivel de hijos). */
export interface BlueprintNavItem {
  label: string
  href?: string | null
  page_key?: string | null
  order_index?: number
  children?: Array<{ label: string; href?: string | null; page_key?: string | null }>
}

/** Regiones de chrome (bloques de header/footer, HU-372). */
export interface BlueprintRegions {
  header?: StarterSection[]
  footer?: StarterSection[]
}

export interface SiteBlueprint {
  pages?: BlueprintPage[]
  nav?: BlueprintNavItem[]
  regions?: BlueprintRegions
}

/** Claves reservadas de las regiones de chrome (espejo de StoreShell, HU-372). */
export const REGION_HEADER_KEY = 'region_header'
export const REGION_FOOTER_KEY = 'region_footer'

export function slugifyKey(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60)
}

/**
 * Normaliza un blueprint (pura). Descarta páginas sin `key`/`label`, slugifica
 * la key, deduplica por key (gana la primera), recorta al tope `maxPages` y
 * limpia ítems de nav vacíos. `null` si no queda nada aplicable.
 */
export function normalizeBlueprint(
  bp: SiteBlueprint | null | undefined,
  opts: { maxPages?: number } = {},
): Required<SiteBlueprint> | null {
  if (!bp || typeof bp !== 'object') return null

  const seen = new Set<string>()
  let pages: BlueprintPage[] = []
  for (const p of Array.isArray(bp.pages) ? bp.pages : []) {
    if (!p || typeof p !== 'object') continue
    const key = slugifyKey(String(p.key ?? ''))
    const label = String(p.label ?? '').trim()
    if (!key || !label || seen.has(key) || key === 'home') continue
    seen.add(key)
    pages.push({
      key,
      label,
      slug: slugifyKey(String(p.slug ?? key)) || key,
      page_type: (p.page_type ?? 'custom').toString(),
      enabled: p.enabled ?? false,
      show_in_footer: p.show_in_footer ?? false,
      order_index: typeof p.order_index === 'number' ? p.order_index : undefined,
      sections: Array.isArray(p.sections) ? p.sections : [],
    })
  }
  if (typeof opts.maxPages === 'number' && opts.maxPages >= 0) pages = pages.slice(0, opts.maxPages)

  const nav: BlueprintNavItem[] = []
  for (const n of Array.isArray(bp.nav) ? bp.nav : []) {
    if (!n || typeof n !== 'object') continue
    const label = String(n.label ?? '').trim()
    if (!label) continue
    const children = (Array.isArray(n.children) ? n.children : [])
      .filter((c) => c && String(c.label ?? '').trim())
      .map((c) => ({
        label: String(c.label).trim(),
        href: c.href ?? null,
        page_key: c.page_key ? slugifyKey(String(c.page_key)) : null,
      }))
    nav.push({
      label,
      href: n.href ?? null,
      page_key: n.page_key ? slugifyKey(String(n.page_key)) : null,
      order_index: typeof n.order_index === 'number' ? n.order_index : undefined,
      children,
    })
  }

  const regions: BlueprintRegions = {
    header: Array.isArray(bp.regions?.header) ? bp.regions!.header : [],
    footer: Array.isArray(bp.regions?.footer) ? bp.regions!.footer : [],
  }

  const hasAnything =
    pages.length > 0 || nav.length > 0 || (regions.header!.length + regions.footer!.length) > 0
  if (!hasAnything) return null
  return { pages, nav, regions }
}

/* ────────────────────────── aplicación (BD) ───────────────────────────── */

/** Inserta las secciones de una página solo si aún no tiene ninguna (idempotente). */
async function seedPageSectionsIfEmpty(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  tenantId: string,
  pageKey: string,
  sections: StarterSection[],
): Promise<'ok' | string> {
  if (!sections.length) return 'skipped (sin secciones)'
  try {
    const { count, error: cErr } = await supabase
      .from('page_sections')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('page_key', pageKey)
    if (cErr) return `error: ${cErr.message}`
    if ((count ?? 0) > 0) return 'skipped (ya existen)'

    for (const [i, sec] of sections.entries()) {
      const { data: secRow, error: sErr } = await supabase
        .from('page_sections')
        .insert({
          tenant_id: tenantId,
          page_key: pageKey,
          section_type: sec.section_type,
          title: sec.title ?? null,
          subtitle: sec.subtitle ?? null,
          body: sec.body ?? null,
          image_url: sec.image_url ?? null,
          cta_label: sec.cta_label ?? null,
          cta_url: sec.cta_url ?? null,
          enabled: sec.enabled ?? true,
          order_index: sec.order_index ?? i * 10,
          settings: { ...(sec.settings ?? {}), sample: true },
        })
        .select('id')
        .single()
      if (sErr || !secRow) return `error: ${sErr?.message ?? 'sin id de sección'}`

      const items = sec.items ?? []
      if (items.length) {
        const { error: iErr } = await supabase.from('section_items').insert(
          items.map((it, j) => ({
            tenant_id: tenantId,
            section_id: secRow.id,
            item_type: it.item_type ?? 'card',
            title: it.title ?? null,
            description: it.description ?? null,
            icon: it.icon ?? null,
            image_url: it.image_url ?? null,
            cta_text: it.cta_text ?? null,
            link_url: it.link_url ?? null,
            enabled: true,
            order_index: it.order_index ?? j + 1,
            metadata: { ...(it.metadata ?? {}), sample: true },
          })),
        )
        if (iErr) return `error (items): ${iErr.message}`
      }
    }
    return 'ok'
  } catch (e) {
    return `error: ${e instanceof Error ? e.message : String(e)}`
  }
}

/** Crea una página solo si no existe (PK compuesta tenant_id,key). Devuelve si se creó. */
async function ensurePage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  tenantId: string,
  page: { key: string; label: string; slug?: string; page_type?: string; enabled?: boolean; show_in_footer?: boolean; order_index?: number },
): Promise<void> {
  await supabase.from('pages').upsert(
    {
      tenant_id: tenantId,
      key: page.key,
      label: page.label,
      slug: page.slug ?? page.key,
      page_type: page.page_type ?? 'custom',
      enabled: page.enabled ?? false,
      show_in_footer: page.show_in_footer ?? false,
      order_index: page.order_index ?? 0,
    },
    { onConflict: 'tenant_id,key', ignoreDuplicates: true },
  )
}

/**
 * Aplica un blueprint a un tenant (idempotente). Devuelve un parte por sección.
 * Llamado por `applyPresetToStore` solo cuando el plan habilita `site_blueprints`.
 */
export async function seedBlueprint(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  tenantId: string,
  blueprint: SiteBlueprint | null | undefined,
  opts: { maxPages?: number } = {},
): Promise<Record<string, 'ok' | string>> {
  const bp = normalizeBlueprint(blueprint, { maxPages: opts.maxPages })
  if (!bp) return { blueprint: 'skipped (vacío)' }
  const results: Record<string, 'ok' | string> = {}

  // 1) Páginas + sus secciones.
  for (const p of bp.pages) {
    try {
      await ensurePage(supabase, tenantId, p)
      results[`page:${p.key}`] = await seedPageSectionsIfEmpty(supabase, tenantId, p.key, p.sections ?? [])
    } catch (e) {
      results[`page:${p.key}`] = `error: ${e instanceof Error ? e.message : String(e)}`
    }
  }

  // 2) Navegación (solo si el tenant aún no tiene menú).
  if (bp.nav.length) {
    results.nav = await seedNavIfEmpty(supabase, tenantId, bp.nav)
  }

  // 3) Regiones de chrome (header/footer) — asegura la página reservada y siembra vacío.
  if (bp.regions.header?.length) {
    await ensurePage(supabase, tenantId, { key: REGION_HEADER_KEY, label: 'Región · Encabezado', slug: 'region-header', page_type: 'region', enabled: false, show_in_footer: false, order_index: 100 })
    results.region_header = await seedPageSectionsIfEmpty(supabase, tenantId, REGION_HEADER_KEY, bp.regions.header)
  }
  if (bp.regions.footer?.length) {
    await ensurePage(supabase, tenantId, { key: REGION_FOOTER_KEY, label: 'Región · Pie de página', slug: 'region-footer', page_type: 'region', enabled: false, show_in_footer: false, order_index: 101 })
    results.region_footer = await seedPageSectionsIfEmpty(supabase, tenantId, REGION_FOOTER_KEY, bp.regions.footer)
  }

  return results
}

/** Siembra el menú solo si el tenant no tiene ítems (no pisa un menú ya editado). */
async function seedNavIfEmpty(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  tenantId: string,
  nav: BlueprintNavItem[],
): Promise<'ok' | string> {
  try {
    const { count, error: cErr } = await supabase
      .from('nav_items').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId)
    if (cErr) return `error: ${cErr.message}`
    if ((count ?? 0) > 0) return 'skipped (ya existe menú)'

    for (const [i, item] of nav.entries()) {
      const { data: parent, error: pErr } = await supabase
        .from('nav_items')
        .insert({
          tenant_id: tenantId,
          label: item.label,
          href: item.href ?? null,
          page_key: item.page_key ?? null,
          order_index: item.order_index ?? i,
          enabled: true,
        })
        .select('id')
        .single()
      if (pErr || !parent) return `error: ${pErr?.message ?? 'sin id de nav'}`

      const children = item.children ?? []
      if (children.length) {
        const { error: cErr2 } = await supabase.from('nav_items').insert(
          children.map((c, j) => ({
            tenant_id: tenantId,
            label: c.label,
            href: c.href ?? null,
            page_key: c.page_key ?? null,
            parent_id: parent.id,
            order_index: j,
            enabled: true,
          })),
        )
        if (cErr2) return `error (hijos): ${cErr2.message}`
      }
    }
    return 'ok'
  } catch (e) {
    return `error: ${e instanceof Error ? e.message : String(e)}`
  }
}
