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
import type { Db } from '../client'
import { seedHomeSections, type StarterSection } from './seed'
import { seedBlueprint, type SiteBlueprint } from './blueprint'
import { listUoms, createUom, getStockItem, createStockItem } from './stock-items'
import { getBomByOutput, createBom, isConsumptionPolicy, type ConsumptionPolicy } from './bom'
import { isItemClass } from './uom'

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
  /** HU-373 · estructura de sitio (páginas + nav + regiones). Gated por plan. */
  blueprint?: SiteBlueprint
  /** HU-410 · datos de arranque del vertical Operaciones (UoMs/ítems/recetas).
   *  Solo se siembra si el plan habilita `inventory` (opts.allowInventory). */
  operations?: OperationsPreset
}

/* ── HU-410 · Preset de Operaciones (datos, no código) ──────────────────────── */

/** Unidad de medida de ejemplo (idempotente por `code`). */
export interface OpUom {
  code: string
  name?: string
  dimension?: string
  to_base_factor?: number
}

/** Ítem de inventario de ejemplo. `uom` referencia una UoM por su `code`. */
export interface OpStockItem {
  key?: string
  name: string
  item_class?: string
  uom?: string
  sellable?: boolean
}

/** Componente de una receta: referencia un ítem por `key` y una UoM por `code`. */
export interface OpBomComponent {
  item: string     // key del ítem componente
  qty: number
  uom?: string
}

/** Receta de ejemplo. `output` referencia el ítem terminado por `key`. */
export interface OpBom {
  output: string
  name?: string
  consumption_policy?: string
  yield_qty?: number
  components: OpBomComponent[]
}

export interface OperationsPreset {
  uoms?: OpUom[]
  stock_items?: OpStockItem[]
  boms?: OpBom[]
}

/** Topes del plan (undefined = sin tope). Resueltos por el llamador (HU-239). */
export interface ApplyPresetLimits {
  categories?: number
  products?: number
  /** HU-373 · tope de páginas del blueprint (p. ej. `max_paginas` del plan). */
  pages?: number
}

export interface ApplyPresetOptions {
  limits?: ApplyPresetLimits
  /**
   * ¿El plan habilita multi-ubicación? (HU-237, feature `multi_location`). Lo
   * resuelve el llamador (server-side, HU-239). Si es false, un preset que pida
   * `multi_location` se degrada a `single` en lugar de fallar.
   */
  allowMultiLocation?: boolean
  /**
   * ¿El plan habilita estructuras de sitio? (HU-373, feature `site_blueprints`).
   * Lo resuelve el llamador. Si es false, el `blueprint` del preset se ignora
   * (solo se siembra el home) → cero regresión.
   */
  allowBlueprint?: boolean
  /**
   * ¿El plan habilita el vertical de Operaciones? (HU-410, feature `inventory`).
   * Lo resuelve el llamador. Si es false, el bloque `operations` del preset se
   * ignora (comportamiento solo-tienda idéntico, AC-2) → cero regresión.
   */
  allowInventory?: boolean
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
  'color_price',
  'font_display',
  'font_body',
  // HU-247 · modo claro/oscuro · HU-121 · layout de la plantilla
  'color_scheme',
  'dark_bg',
  'dark_surface',
  'dark_text',
  'template',
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
  db: Db,
): Promise<ApplyPresetResult> {
  if (!tenantId) throw new Error('[apply-preset] tenantId requerido')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = db as any
  const results: Record<string, 'ok' | string> = {}

  // HU-121: la plantilla (tema) lleva su propio layout; el template va tanto al
  // tema (fuente de verdad) como a store_config.template (fallback legacy).
  results.theme = await applyTheme(supabase, tenantId, preset.theme, preset.template)
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

  // HU-373 · estructura de sitio (páginas + nav + regiones). Solo si el plan la
  // habilita; si no, se ignora (cero regresión). Idempotente dentro de seedBlueprint.
  if (opts.allowBlueprint && preset.blueprint) {
    const bpResults = await seedBlueprint(supabase, tenantId, preset.blueprint, { maxPages: opts.limits?.pages })
    for (const [k, v] of Object.entries(bpResults)) results[`blueprint.${k}`] = v
  } else if (preset.blueprint) {
    results['blueprint'] = 'skipped (plan sin site_blueprints)'
  }

  // HU-410 · datos de arranque de Operaciones (UoMs/ítems/recetas). Solo si el
  // plan habilita `inventory`; si no, se ignora (cero regresión, AC-2).
  if (opts.allowInventory && preset.operations) {
    const opResults = await seedOperations(db, tenantId, preset.operations)
    for (const [k, v] of Object.entries(opResults)) results[`operations.${k}`] = v
  } else if (preset.operations) {
    results['operations'] = 'skipped (plan sin inventory)'
  }

  return { tenantId, results }
}

/** Tema: (sobre)escribe el tema del tenant. Update-in-place para no violar el
 *  índice de tema activo por tenant; si no hay tema, inserta uno activo. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function applyTheme(supabase: any, tenantId: string, theme?: Record<string, unknown>, template?: string): Promise<'ok' | string> {
  if (!theme || Object.keys(theme).length === 0) return 'skipped (sin tema)'
  const row: Record<string, unknown> = { tenant_id: tenantId, is_active: true }
  for (const [k, v] of Object.entries(theme)) if (THEME_COLS.has(k)) row[k] = v
  // HU-121: el layout de la plantilla vive en el tema (si el preset no lo trae en theme).
  if (template && template.trim() && row.template == null) row.template = template.trim()
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

/* ── HU-410 · Operaciones: normalización pura + siembra idempotente ─────────── */

export interface NormalizedOperations {
  uoms: Array<{ code: string; name: string; dimension: string; to_base_factor: number }>
  stock_items: Array<{ key: string; name: string; item_class: string; uom: string | null; sellable: boolean }>
  boms: Array<{ output: string; name: string | null; consumption_policy: ConsumptionPolicy; yield_qty: number; components: Array<{ item: string; qty: number; uom: string | null }> }>
}

/**
 * Normaliza (puro, sin BD) el bloque `operations` de un preset: deriva claves
 * (`slugify(name)`), aplica defaults (clase `insumo`, política `al_vender`,
 * rendimiento 1), descarta ítems sin nombre y recetas cuyo `output`/componentes
 * no referencien un ítem declarado. Idempotente: dedup por clave de ítem y por
 * `output` de receta. No valida existencia en BD (eso lo hace el seeder).
 */
export function normalizeOperationsPreset(op: OperationsPreset | undefined): NormalizedOperations {
  const uoms = (op?.uoms ?? [])
    .filter((u) => u?.code && u.code.trim())
    .map((u) => ({
      code: u.code.trim(),
      name: (u.name ?? u.code).trim(),
      dimension: u.dimension ?? 'count',
      to_base_factor: typeof u.to_base_factor === 'number' && u.to_base_factor > 0 ? u.to_base_factor : 1,
    }))

  const seenItem = new Set<string>()
  const stock_items: NormalizedOperations['stock_items'] = []
  for (const it of op?.stock_items ?? []) {
    if (!it?.name || !it.name.trim()) continue
    const key = (it.key?.trim() || slugify(it.name))
    if (!key || seenItem.has(key)) continue
    seenItem.add(key)
    stock_items.push({
      key,
      name: it.name.trim(),
      item_class: isItemClass(it.item_class) ? it.item_class : 'insumo',
      uom: it.uom?.trim() || null,
      sellable: it.sellable ?? false,
    })
  }
  const itemKeys = new Set(stock_items.map((i) => i.key))

  const seenBom = new Set<string>()
  const boms: NormalizedOperations['boms'] = []
  for (const b of op?.boms ?? []) {
    const output = b?.output?.trim()
    if (!output || !itemKeys.has(output) || seenBom.has(output)) continue
    const components = (b.components ?? [])
      .map((c) => ({ item: c?.item?.trim() ?? '', qty: Number(c?.qty), uom: c?.uom?.trim() || null }))
      .filter((c) => c.item && itemKeys.has(c.item) && c.qty > 0)
    if (!components.length) continue
    seenBom.add(output)
    boms.push({
      output,
      name: b.name?.trim() || null,
      consumption_policy: isConsumptionPolicy(b.consumption_policy) ? b.consumption_policy : 'al_vender',
      yield_qty: typeof b.yield_qty === 'number' && b.yield_qty > 0 ? b.yield_qty : 1,
      components,
    })
  }

  return { uoms, stock_items, boms }
}

/**
 * Siembra el vertical de Operaciones en el tenant (idempotente): UoMs por `code`,
 * ítems por `key` y recetas por `output`. Reusa las queries del ledger. No pisa
 * lo existente. El llamador ya verificó `allowInventory`.
 */
async function seedOperations(db: Db, tenantId: string, op: OperationsPreset): Promise<Record<string, 'ok' | string>> {
  const plan = normalizeOperationsPreset(op)
  const results: Record<string, 'ok' | string> = {}

  // 1) UoMs (idempotente por code sobre las ya sembradas por la migración/tenant).
  const uomByCode = new Map<string, number>()
  try {
    const existing = await listUoms(db)
    for (const u of existing) uomByCode.set(u.code, u.id)
    let created = 0
    for (const u of plan.uoms) {
      if (uomByCode.has(u.code)) continue
      const row = await createUom(db, { tenant_id: tenantId, code: u.code, name: u.name, dimension: u.dimension, to_base_factor: u.to_base_factor })
      uomByCode.set(u.code, row.id)
      created += 1
    }
    results.uoms = `ok (${created} nuevas)`
  } catch (e) {
    results.uoms = `error: ${e instanceof Error ? e.message : String(e)}`
  }

  // 2) Ítems (idempotente por key). Resuelve uom_id por code.
  const itemByKey = new Map<string, number>()
  try {
    let created = 0
    for (const it of plan.stock_items) {
      const found = await getStockItem(db, it.key)
      if (found) { itemByKey.set(it.key, found.id); continue }
      const row = await createStockItem(db, {
        tenant_id: tenantId, key: it.key, name: it.name, item_class: it.item_class,
        uom_id: it.uom ? (uomByCode.get(it.uom) ?? null) : null, sellable: it.sellable,
      })
      itemByKey.set(it.key, row.id)
      created += 1
    }
    results.stock_items = `ok (${created} nuevos)`
  } catch (e) {
    results.stock_items = `error: ${e instanceof Error ? e.message : String(e)}`
  }

  // 3) Recetas (idempotente por output). Omite si falta algún id resuelto.
  try {
    let created = 0
    for (const b of plan.boms) {
      const outputId = itemByKey.get(b.output)
      if (outputId == null) continue
      if (await getBomByOutput(db, outputId)) continue
      const components = b.components
        .map((c) => ({ component_stock_item_id: itemByKey.get(c.item), qty: c.qty, uom_id: c.uom ? (uomByCode.get(c.uom) ?? null) : null }))
        .filter((c): c is { component_stock_item_id: number; qty: number; uom_id: number | null } => c.component_stock_item_id != null)
      if (!components.length) continue
      await createBom(db, {
        tenant_id: tenantId, output_stock_item_id: outputId, name: b.name,
        consumption_policy: b.consumption_policy, yield_qty: b.yield_qty, components,
      })
      created += 1
    }
    results.boms = `ok (${created} nuevas)`
  } catch (e) {
    results.boms = `error: ${e instanceof Error ? e.message : String(e)}`
  }

  return results
}
