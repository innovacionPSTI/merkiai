/**
 * queries/price-lists.ts — Listas de precio por contexto (HU-407, E24).
 *
 * `resolveEffectivePrice` es **pura** (sin BD): dado el precio base de un
 * producto/variante y las entradas de lista aplicables al contexto, devuelve el
 * precio efectivo. Reglas:
 *   - Sin entradas aplicables → precio base (cero regresión, AC-3).
 *   - Una entrada de **variante** gana sobre una de **producto** (más específica).
 *   - A igual especificidad, gana la de mayor `priority`; empate → la más
 *     reciente (mayor `id`).
 * La resolución por canal/sede/segmento se hace filtrando las listas por su
 * `scope` antes de llamar a esta función (helper `selectApplicableLists`).
 * El precio de campaña (VIP/promos) se aplica encima, fuera de esta capa.
 */
import type { Db } from '../client'

export type PriceScopeType = 'channel' | 'location' | 'segment' | 'generic'

export interface PriceList {
  id: number
  tenant_id?: string
  key: string
  name: string
  scope_type: PriceScopeType
  scope_value: string | null
  priority: number
  active: boolean
}

export interface PriceListItem {
  id: number
  tenant_id?: string
  price_list_id: number
  product_id: number | null
  variant_id: number | null
  price: number
}

/** Contexto de venta para resolver qué listas aplican. */
export interface PriceContext {
  channel?: string | null
  location?: string | null
  segment?: string | null
}

const SCOPES: PriceScopeType[] = ['channel', 'location', 'segment', 'generic']

export function isPriceScopeType(v: string): v is PriceScopeType {
  return (SCOPES as string[]).includes(v)
}

/**
 * Filtra las listas que aplican a un contexto: las `generic` siempre aplican; las
 * de ámbito aplican cuando su `scope_value` coincide con el valor del contexto.
 */
export function selectApplicableLists(lists: PriceList[], ctx: PriceContext): PriceList[] {
  return lists.filter((l) => {
    if (!l.active) return false
    switch (l.scope_type) {
      case 'generic': return true
      case 'channel': return l.scope_value != null && l.scope_value === ctx.channel
      case 'location': return l.scope_value != null && l.scope_value === ctx.location
      case 'segment': return l.scope_value != null && l.scope_value === ctx.segment
      default: return false
    }
  })
}

/**
 * Precio efectivo para un (producto, variante). `items` deben pertenecer a listas
 * aplicables (ya filtradas). `listPriority` mapea price_list_id → priority.
 */
export function resolveEffectivePrice(
  basePrice: number,
  opts: { productId: number; variantId?: number | null; items: PriceListItem[]; listPriority: Map<number, number> },
): number {
  const { productId, variantId, items, listPriority } = opts
  const matches = items.filter((it) =>
    (variantId != null && it.variant_id === variantId) ||
    (it.variant_id == null && it.product_id === productId),
  )
  if (!matches.length) return basePrice

  const score = (it: PriceListItem): [number, number, number] => [
    it.variant_id != null ? 1 : 0,                 // especificidad: variante > producto
    listPriority.get(it.price_list_id) ?? 0,       // prioridad de la lista
    it.id,                                          // desempate: más reciente
  ]
  const best = matches.reduce((a, b) => {
    const [as0, as1, as2] = score(a)
    const [bs0, bs1, bs2] = score(b)
    if (bs0 !== as0) return bs0 > as0 ? b : a
    if (bs1 !== as1) return bs1 > as1 ? b : a
    return bs2 > as2 ? b : a
  })
  return best.price
}

/* ───────────────────────────── BD ─────────────────────────────────────────── */

export async function listPriceLists(db: Db, opts: { activeOnly?: boolean } = {}): Promise<PriceList[]> {
  let q = db.from('price_lists').select('*').order('priority', { ascending: false }).order('name')
  if (opts.activeOnly) q = q.eq('active', true)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as unknown as PriceList[]
}

export async function getPriceListItems(db: Db, priceListId: number): Promise<PriceListItem[]> {
  const { data, error } = await db.from('price_list_items').select('*').eq('price_list_id', priceListId).order('id')
  if (error) throw error
  return (data ?? []) as unknown as PriceListItem[]
}

export async function createPriceList(
  db: Db,
  input: { tenant_id?: string; key: string; name: string; scope_type?: PriceScopeType; scope_value?: string | null; priority?: number },
): Promise<PriceList> {
  const row = {
    tenant_id: input.tenant_id,
    key: input.key.trim(),
    name: input.name.trim(),
    scope_type: input.scope_type ?? 'generic',
    scope_value: input.scope_value?.trim() || null,
    priority: input.priority ?? 0,
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await db.from('price_lists').insert(row as any).select().single()
  if (error) throw error
  return data as unknown as PriceList
}

export async function updatePriceList(
  db: Db,
  id: number,
  patch: Partial<{ name: string; scope_type: PriceScopeType; scope_value: string | null; priority: number; active: boolean }>,
): Promise<PriceList> {
  const { data, error } = await db
    .from('price_lists')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ ...patch, updated_at: new Date().toISOString() } as any)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as unknown as PriceList
}

/** Alta/actualización de un precio de lista (upsert por lista+producto o lista+variante). */
export async function setPriceListItem(
  db: Db,
  input: { tenant_id?: string; price_list_id: number; product_id?: number | null; variant_id?: number | null; price: number },
): Promise<PriceListItem> {
  const productId = input.variant_id != null ? null : (input.product_id ?? null)
  const variantId = input.variant_id ?? null
  if ((productId == null) === (variantId == null)) {
    throw new Error('[price-lists] indica product_id o variant_id (exactamente uno)')
  }
  const conflict = variantId != null ? 'price_list_id,variant_id' : 'price_list_id,product_id'
  const row = {
    tenant_id: input.tenant_id,
    price_list_id: input.price_list_id,
    product_id: productId,
    variant_id: variantId,
    price: input.price,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await db
    .from('price_list_items')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .upsert(row as any, { onConflict: conflict })
    .select()
    .single()
  if (error) throw error
  return data as unknown as PriceListItem
}

export async function deletePriceListItem(db: Db, id: number): Promise<void> {
  const { error } = await db.from('price_list_items').delete().eq('id', id)
  if (error) throw error
}
