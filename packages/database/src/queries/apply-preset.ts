/**
 * queries/apply-preset.ts — Orquestador "Aplicar preset a la tienda" (HU-235).
 *
 * COPIA un Preset (curado en la BD de PLATAFORMA, HU-233) al PLANO DE TIENDA de
 * un tenant: Tema (paleta) + Template (layout) + secciones de arranque del home
 * + categorías/productos de ejemplo. Es la ÚNICA fuente de verdad de la puesta a
 * punto, reutilizable por la consola (al aprovisionar) y por el admin (wizard /
 * re-aplicar).
 *
 * Política:
 *  - **Tema y Template** se (sobre)escriben: aplicar un preset ES elegir estos.
 *  - **Home, categorías y productos** son de arranque: solo se siembran si el
 *    tenant aún no los tiene (idempotente; no duplica catálogo ni pisa lo que el
 *    dueño ya editó). Marcados como ejemplo donde el esquema lo permite.
 *  - **Límites (HU-239)**: el llamador resuelve los topes del plan y los pasa en
 *    `opts.limits`; aquí solo se recortan los arreglos de ejemplo a esos topes.
 *    (La resolución/enforcement de entitlements vive en el llamador, server-side.)
 *  - **inventory_model** (HU-237): se escribe en `store_config`; si el preset pide
 *    `multi_location` y el plan no lo habilita (`opts.allowMultiLocation`), se degrada
 *    a `single` en vez de fallar.
 *
 * Corre con service-role (control plane / admin autorizado); `tenant_id` se fija
 * explícitamente en cada escritura porque el service-role no pasa por RLS.
 */
import { createServerClient, type Db } from '../client'
import { seedHomeSections, type StarterSection } from './seed'

export interface SampleCategory {
  name: string
  slug?: string
  description?: string
  image_url?: string
  order_index?: number
}

export interface SampleProduct {
  name: string
  slug?: string
  description?: string
  price: number
  category_slug?: string
  featured?: boolean
  stock?: number
}

/** Contenido del preset a materializar (subconjunto de PresetRow). */
export interface PresetPayload {
  theme?: Record<string, unknown>
  template?: string
  home_sections?: StarterSection[]
  sample_categories?: SampleCategory[]
  sample_products?: SampleProduct[]
  inventory_model?: 'single' | 'multi_location'
}

/** Topes del plan (undefined = sin tope). Resueltos por el llamador (HU-239). */
export interface ApplyPresetLimits {
  categories?: number
  products?: number
}

export interface ApplyPresetOptions {
  limits?: ApplyPresetLimits
  /**
   * ¿El plan habilita multi-ubicación? (HU-237, feature `multi_location`). Lo
   * resuelve el llamador (server-side, HU-239). Si es false, un preset que pida
   * `multi_location` se degrada a `single` en lugar de fallar.
   */
  allowMultiLocation?: boolean
}

export interface ApplyPresetResult {
  tenantId: string
  results: Record<string, 'ok' | string>
}

/** Columnas conocidas de `themes` que un preset puede definir. */
const THEME_COLS = new Set([
  'name',
  'color_primary',
  'color_dark',
  'color_cream',
  'color_cream_warm',
  'color_yellow',
  'color_yellow_pale',
  'color_text',
  'font_display',
  'font_body',
])

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60)
}

function cap<T>(arr: T[] | undefined, limit: number | undefined): T[] {
  const a = arr ?? []
  return typeof limit === 'number' && limit >= 0 ? a.slice(0, limit) : a
}

export async function applyPresetToStore(
  tenantId: string,
  preset: PresetPayload,
  opts: ApplyPresetOptions = {},
  db: Db = createServerClient(),
): Promise<ApplyPresetResult> {
  if (!tenantId) throw new Error('[apply-preset] tenantId requerido')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = db as any
  const results: Record<string, 'ok' | string> = {}

  results.theme = await applyTheme(supabase, tenantId, preset.theme)
  results.template = await applyTemplate(supabase, tenantId, preset.template)
  results.inventory_model = await applyInventoryModel(
    supabase, tenantId, preset.inventory_model, !!opts.allowMultiLocation,
  )
  results.home_sections = await seedHomeSections(supabase, tenantId, preset.home_sections ?? [])
  results.categories = await seedSampleCategories(
    supabase, tenantId, cap(preset.sample_categories, opts.limits?.categories),
  )
  results.products = await seedSampleProducts(
    supabase, tenantId, cap(preset.sample_products, opts.limits?.products),
  )

  return { tenantId, results }
}

/** Tema: (sobre)escribe el tema del tenant. Update-in-place para no violar el
 *  índice de tema activo por tenant; si no hay tema, inserta uno activo. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function applyTheme(supabase: any, tenantId: string, theme?: Record<string, unknown>): Promise<'ok' | string> {
  if (!theme || Object.keys(theme).length === 0) return 'skipped (sin tema)'
  const row: Record<string, unknown> = { tenant_id: tenantId, is_active: true }
  for (const [k, v] of Object.entries(theme)) if (THEME_COLS.has(k)) row[k] = v
  if (!row.name) row.name = 'Preset'
  try {
    const { data: existing, error: selErr } = await supabase
      .from('themes').select('id').eq('tenant_id', tenantId).limit(1).maybeSingle()
    if (selErr) return `error: ${selErr.message}`
    if (existing?.id) {
      const { error } = await supabase.from('themes').update(row).eq('id', existing.id).eq('tenant_id', tenantId)
      return error ? `error: ${error.message}` : 'ok'
    }
    const { error } = await supabase.from('themes').insert(row)
    return error ? `error: ${error.message}` : 'ok'
  } catch (e) {
    return `error: ${e instanceof Error ? e.message : String(e)}`
  }
}

/** Template: (sobre)escribe store_config.template del tenant. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function applyTemplate(supabase: any, tenantId: string, template?: string): Promise<'ok' | string> {
  const t = (template ?? '').trim()
  if (!t) return 'skipped (sin template)'
  try {
    const { error } = await supabase.from('store_config').update({ template: t }).eq('tenant_id', tenantId)
    return error ? `error: ${error.message}` : 'ok'
  } catch (e) {
    return `error: ${e instanceof Error ? e.message : String(e)}`
  }
}

/** Modelo de inventario (HU-237): escribe store_config.inventory_model. Si el
 *  preset pide multi_location pero el plan no lo habilita, degrada a single. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function applyInventoryModel(
  supabase: any, tenantId: string, model: 'single' | 'multi_location' | undefined, allowMulti: boolean,
): Promise<'ok' | string> {
  if (!model) return 'skipped (sin modelo)'
  const effective = model === 'multi_location' && !allowMulti ? 'single' : model
  try {
    const { error } = await supabase
      .from('store_config').update({ inventory_model: effective }).eq('tenant_id', tenantId)
    if (error) return `error: ${error.message}`
    return effective === model ? 'ok' : 'ok (degradado a single: plan sin multi_location)'
  } catch (e) {
    return `error: ${e instanceof Error ? e.message : String(e)}`
  }
}

/** Categorías de ejemplo: solo si el tenant no tiene ninguna. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function seedSampleCategories(supabase: any, tenantId: string, cats: SampleCategory[]): Promise<'ok' | string> {
  if (!cats.length) return 'skipped (sin categorías)'
  try {
    const { count, error: cErr } = await supabase
      .from('categories').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId)
    if (cErr) return `error: ${cErr.message}`
    if ((count ?? 0) > 0) return 'skipped (ya existen)'

    const rows = cats.map((c, i) => ({
      tenant_id: tenantId,
      name: c.name,
      slug: c.slug?.trim() || slugify(c.name),
      description: c.description ?? null,
      image_url: c.image_url ?? null,
      order_index: c.order_index ?? i,
      active: true,
    }))
    const { error } = await supabase.from('categories').insert(rows)
    return error ? `error: ${error.message}` : 'ok'
  } catch (e) {
    return `error: ${e instanceof Error ? e.message : String(e)}`
  }
}

/** Productos de ejemplo: solo si el tenant no tiene ninguno. Cada producto lleva
 *  una variante única con su precio (mínimo vendible). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function seedSampleProducts(supabase: any, tenantId: string, prods: SampleProduct[]): Promise<'ok' | string> {
  if (!prods.length) return 'skipped (sin productos)'
  try {
    const { count, error: cErr } = await supabase
      .from('products').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId)
    if (cErr) return `error: ${cErr.message}`
    if ((count ?? 0) > 0) return 'skipped (ya existen)'

    // Mapa slug de categoría → id (para vincular productos a categorías del preset).
    const { data: cats } = await supabase.from('categories').select('id, slug').eq('tenant_id', tenantId)
    const bySlug = new Map<string, number>((cats ?? []).map((c: { id: number; slug: string }) => [c.slug, c.id]))

    for (const p of prods) {
      const slug = p.slug?.trim() || slugify(p.name)
      const categoryId = p.category_slug ? bySlug.get(p.category_slug) ?? null : null
      const { data: prodRow, error: pErr } = await supabase
        .from('products')
        .insert({
          tenant_id: tenantId,
          name: p.name,
          slug,
          description: p.description ?? null,
          category_id: categoryId,
          active: true,
          featured: p.featured ?? false,
        })
        .select('id')
        .single()
      if (pErr || !prodRow) return `error: ${pErr?.message ?? 'sin id de producto'}`

      const { error: vErr } = await supabase.from('product_variants').insert({
        tenant_id: tenantId,
        product_id: prodRow.id,
        price: Math.max(0, Math.round(p.price)),
        stock: p.stock ?? 0,
        active: true,
      })
      if (vErr) return `error (variante): ${vErr.message}`
    }
    return 'ok'
  } catch (e) {
    return `error: ${e instanceof Error ? e.message : String(e)}`
  }
}
