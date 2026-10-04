/**
 * HU-255 · Paquete de página export/import.
 *
 * Serializa una página completa (`pages` + sus `page_sections` + `section_items`)
 * a un paquete JSON **versionado y tolerante** (mismo patrón que `template-package.ts`
 * de HU-129): ignora claves desconocidas, rellena las nuevas con defaults y rechaza
 * versiones futuras. Permite guardar/mover/reutilizar páginas y es la base para
 * construir templates/presets desde una página real (HU-256).
 *
 * La construcción/validación es pura y testeable; los helpers de BD la envuelven.
 */
import type { Db } from '../client'
import type { Page, PageSection, SectionItem } from '../types'
import { getPageSections, getSectionItems, createPage, createPageSection, createSectionItem } from './content'

export const PAGE_PACKAGE_VERSION = 1
export const PAGE_PACKAGE_KIND = 'merkiai.page' as const

/** Campos de la página que viajan (sin key/slug/enabled/order/timestamps). */
export const PACKAGE_PAGE_FIELDS = [
  'label', 'page_type', 'show_in_footer', 'meta_title', 'meta_description',
] as const

/** Columnas de sección que viajan. */
export const PACKAGE_SECTION_COLS = [
  'section_type', 'title', 'subtitle', 'body', 'image_url', 'cta_label', 'cta_url',
  'enabled', 'order_index', 'settings',
] as const

/** Columnas de ítem que viajan. */
export const PACKAGE_ITEM_COLS = [
  'item_type', 'icon', 'title', 'description', 'question', 'answer',
  'image_url', 'image_url_mobile', 'link_url', 'cta_text', 'metadata',
  'enabled', 'order_index',
] as const

export interface PagePackageSection {
  [col: string]: unknown
  items: Record<string, unknown>[]
}

export interface PagePackage {
  kind: typeof PAGE_PACKAGE_KIND
  schema_version: number
  exported_at?: string
  page: Partial<Record<(typeof PACKAGE_PAGE_FIELDS)[number], unknown>>
  sections: PagePackageSection[]
}

function pick<T extends Record<string, unknown>>(row: T, cols: readonly string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const c of cols) if (c in row) out[c] = row[c]
  return out
}

/** Construye el paquete a partir de la página + sus secciones con ítems (pura). */
export function buildPagePackage(
  page: Pick<Page, 'label' | 'page_type' | 'show_in_footer' | 'meta_title' | 'meta_description'>,
  sections: (PageSection & { items: SectionItem[] })[],
): PagePackage {
  return {
    kind: PAGE_PACKAGE_KIND,
    schema_version: PAGE_PACKAGE_VERSION,
    exported_at: new Date().toISOString(),
    page: pick(page as unknown as Record<string, unknown>, PACKAGE_PAGE_FIELDS),
    sections: sections.map((s) => ({
      ...pick(s as unknown as Record<string, unknown>, PACKAGE_SECTION_COLS),
      items: (s.items ?? []).map((it) => pick(it as unknown as Record<string, unknown>, PACKAGE_ITEM_COLS)),
    })),
  }
}

export class PagePackageError extends Error {}

export interface ParsedPagePackage {
  page: Record<string, unknown>
  sections: PagePackageSection[]
}

/** Valida y normaliza un paquete (pura, tolerante). */
export function parsePagePackage(raw: unknown): ParsedPagePackage {
  if (!raw || typeof raw !== 'object') throw new PagePackageError('Paquete inválido: no es un objeto.')
  const pkg = raw as Record<string, unknown>
  if (pkg.kind !== PAGE_PACKAGE_KIND) throw new PagePackageError('Paquete inválido: no es una página Merkiai.')
  const version = Number(pkg.schema_version)
  if (!Number.isFinite(version) || version < 1) throw new PagePackageError('Paquete inválido: versión de esquema ausente.')
  if (version > PAGE_PACKAGE_VERSION) {
    throw new PagePackageError(`Paquete creado con una versión más nueva (v${version}); actualiza Merkiai para importarlo.`)
  }
  const pageRaw = (pkg.page && typeof pkg.page === 'object') ? pkg.page as Record<string, unknown> : {}
  const page = pick(pageRaw, PACKAGE_PAGE_FIELDS)

  const sectionsRaw = Array.isArray(pkg.sections) ? pkg.sections : []
  const sections: PagePackageSection[] = sectionsRaw.map((sr) => {
    const s = (sr && typeof sr === 'object') ? sr as Record<string, unknown> : {}
    const cols = pick(s, PACKAGE_SECTION_COLS)
    const itemsRaw = Array.isArray(s.items) ? s.items : []
    const items = itemsRaw.map((ir) => pick((ir && typeof ir === 'object') ? ir as Record<string, unknown> : {}, PACKAGE_ITEM_COLS))
    return { ...cols, items } as PagePackageSection
  }).filter((s) => typeof s.section_type === 'string' && !!s.section_type)

  return { page, sections }
}

// ─── Helpers de BD ───────────────────────────────────────────────────────────

/** Lee una página y arma su paquete (HU-255). */
export async function exportPage(pageKey: string, db: Db): Promise<PagePackage> {
  const { data: pageRow } = await db.from('pages').select('*').eq('key', pageKey).maybeSingle()
  if (!pageRow) throw new PagePackageError('Página no encontrada.')
  const sections = await getPageSections(pageKey, false, db)
  const withItems = await Promise.all(
    sections.map(async (s) => ({ ...s, items: await getSectionItems(s.id, false, db) })),
  )
  return buildPagePackage(pageRow as unknown as Page, withItems)
}

export interface ImportPageOptions {
  key: string
  slug: string
  label?: string
}

/**
 * Importa un paquete creando una página NUEVA en estado borrador (enabled=false).
 * Las secciones conservan su `enabled`/orden; los `section_key`/ids se regeneran
 * (no se copian), evitando colisiones. Idempotencia a cargo del caller (key/slug).
 */
export async function importPagePackage(raw: unknown, db: Db, opts: ImportPageOptions): Promise<Page> {
  const { page: pageFields, sections } = parsePagePackage(raw)
  const key = opts.key.trim()
  const slug = opts.slug.trim()
  if (!key || !slug) throw new PagePackageError('La página necesita key y slug.')

  const page = await createPage({
    key,
    slug,
    label: (opts.label?.trim() || (pageFields.label as string) || key),
    page_type: (pageFields.page_type as string) || 'custom',
    enabled: false, // borrador: no se publica al importar
    show_in_footer: pageFields.show_in_footer === true,
    meta_title: (pageFields.meta_title as string) ?? null,
    meta_description: (pageFields.meta_description as string) ?? null,
  }, db)

  for (const [i, s] of sections.entries()) {
    const created = await createPageSection({
      page_key: key,
      section_type: s.section_type as string,
      title: (s.title as string) ?? null,
      subtitle: (s.subtitle as string) ?? null,
      body: (s.body as string) ?? null,
      image_url: (s.image_url as string) ?? null,
      cta_label: (s.cta_label as string) ?? null,
      cta_url: (s.cta_url as string) ?? null,
      enabled: s.enabled !== false,
      order_index: typeof s.order_index === 'number' ? s.order_index : i,
      settings: (s.settings && typeof s.settings === 'object') ? s.settings as Record<string, unknown> : {},
    }, db)

    for (const [j, it] of (s.items ?? []).entries()) {
      await createSectionItem({
        section_id: created.id,
        item_type: (it.item_type as string) || 'card',
        icon: (it.icon as string) ?? null,
        title: (it.title as string) ?? null,
        description: (it.description as string) ?? null,
        question: (it.question as string) ?? null,
        answer: (it.answer as string) ?? null,
        image_url: (it.image_url as string) ?? null,
        image_url_mobile: (it.image_url_mobile as string) ?? null,
        link_url: (it.link_url as string) ?? null,
        cta_text: (it.cta_text as string) ?? null,
        metadata: (it.metadata && typeof it.metadata === 'object') ? it.metadata as Record<string, unknown> : {},
        enabled: it.enabled !== false,
        order_index: typeof it.order_index === 'number' ? it.order_index : j,
      }, db)
    }
  }

  return page
}
