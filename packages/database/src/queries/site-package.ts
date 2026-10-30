/**
 * HU-123 v1 · Export de sitio (backup/migración).
 *
 * Empaqueta TODO el sitio de un tenant en un JSON versionado: el **Tema**
 * (paquete de HU-129), la **configuración NO sensible** de la tienda, el **nav**
 * y **todas las páginas** (paquetes de HU-255). Sirve para respaldar o clonar.
 *
 * Seguridad: la config se filtra con un **allowlist** (nunca secretos como
 * `resend_api_key`; las credenciales de pago viven en otra tabla y no se tocan).
 *
 * El import completo (con remapeo de colisiones de key/slug) es v2; hoy las
 * piezas ya son importables por separado (Tema HU-129, páginas HU-255).
 */
import type { Db } from '../client'
import { buildTemplatePackage, type TemplatePackage } from './template-package'
import { exportPage, type PagePackage } from './page-package'
import { buildCollectionPackage, type CollectionPackage } from './collection-package'
import { getPages } from './content'
import { listCollections, listCollectionItems } from './collections'
import { listSavedBlocks } from './saved-blocks'
import { getNavTree } from './nav'
import type { Theme } from './themes'

export const SITE_PACKAGE_VERSION = 1
export const SITE_PACKAGE_KIND = 'merkiai.site' as const

/** Campos de `store_config` que SÍ se exportan (allowlist — sin secretos). */
export const SAFE_STORE_CONFIG_FIELDS = [
  'store_name', 'store_description', 'seo_keywords', 'store_email',
  'logo_url', 'favicon_url', 'template', 'inventory_model',
  'whatsapp_number', 'order_prefix',
  'terms_content', 'privacy_content',
  'instagram_url', 'instagram_enabled', 'facebook_url', 'facebook_enabled',
  'tiktok_url', 'tiktok_enabled',
  'maintenance_mode', 'analytics_enabled', 'trust_badges',
  'footer_show_store', 'footer_show_blog', 'footer_show_legal',
  'nav_show_cart', 'nav_show_auth',
  'email_provider', 'resend_from_email',
] as const

/** Filtra la config a los campos seguros (defensa ante secretos/columnas futuras). */
export function safeStoreConfig(config: unknown): Record<string, unknown> {
  const c = (config && typeof config === 'object') ? config as Record<string, unknown> : {}
  const out: Record<string, unknown> = {}
  for (const k of SAFE_STORE_CONFIG_FIELDS) if (k in c) out[k] = c[k]
  return out
}

export interface SitePackage {
  kind: typeof SITE_PACKAGE_KIND
  schema_version: number
  exported_at: string
  theme: TemplatePackage | null
  store_config: Record<string, unknown>
  nav: unknown
  pages: PagePackage[]
  /** HU-353 AC-5 · definiciones de colección (con registros de ejemplo opcionales). */
  collections: CollectionPackage[]
  /** HU-358 AC-3 · bloques guardados del tenant (label + section_type + payload). */
  saved_blocks: { label: string; section_type: string; payload: unknown }[]
}

export interface BuildSiteInput {
  theme: Theme | null
  storeConfig: unknown
  nav: unknown
  pages: PagePackage[]
  collections?: CollectionPackage[]
  savedBlocks?: { label: string; section_type: string; payload: unknown }[]
}

/** Arma el paquete de sitio (pura). */
export function buildSitePackage(input: BuildSiteInput): SitePackage {
  return {
    kind: SITE_PACKAGE_KIND,
    schema_version: SITE_PACKAGE_VERSION,
    exported_at: new Date().toISOString(),
    theme: input.theme ? buildTemplatePackage(input.theme) : null,
    store_config: safeStoreConfig(input.storeConfig),
    nav: input.nav ?? [],
    pages: input.pages,
    collections: input.collections ?? [],
    saved_blocks: input.savedBlocks ?? [],
  }
}

/** Reúne todo el sitio del tenant y arma el backup (HU-123 v1 + HU-353 colecciones). */
export async function exportSite(db: Db, tenantId: string, opts: { includeCollectionRecords?: boolean } = {}): Promise<SitePackage> {
  const [{ data: themeRow }, { data: configRow }, nav, pages, collections, savedBlocks] = await Promise.all([
    db.from('themes').select('*').eq('is_active', true).maybeSingle(),
    db.from('store_config').select('*').eq('tenant_id', tenantId).maybeSingle(),
    getNavTree(db).catch(() => []),
    getPages(db).catch(() => []),
    listCollections(db).catch(() => []),
    listSavedBlocks(db).catch(() => []),
  ])
  const pagePackages = await Promise.all(pages.map((p) => exportPage(p.key, db)))
  const collectionPackages = await Promise.all(collections.map(async (c) => {
    const records = opts.includeCollectionRecords
      ? await listCollectionItems(db, { collectionKey: c.key }).catch(() => [])
      : undefined
    return buildCollectionPackage(c, records)
  }))
  return buildSitePackage({
    theme: (themeRow as unknown as Theme) ?? null,
    storeConfig: configRow,
    nav,
    pages: pagePackages,
    collections: collectionPackages,
    savedBlocks: savedBlocks.map((b) => ({ label: b.label, section_type: b.section_type, payload: b.payload })),
  })
}
