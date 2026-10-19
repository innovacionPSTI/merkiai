import type { Db } from '../client'

/**
 * Motor de descuentos y promociones (HU-147). Reglas más allá de cupones, con
 * vigencia y combinabilidad. El **cálculo es puro y testeable** (`computePromotions`)
 * y el checkout lo ejecuta en el servidor (autoridad del total, AC-4). `db` se
 * pasa por parámetro (RLS por tenant).
 */

export type PromotionType = 'cart_percent' | 'cart_fixed' | 'category_percent' | 'bogo'

export interface PromotionConfig {
  /** cart_percent / category_percent / bogo: porcentaje 0..100. */
  percent?: number
  /** cart_fixed: monto fijo a descontar. */
  amount?: number
  /** cart_*: subtotal mínimo para aplicar. */
  min_subtotal?: number
  /** category_percent / bogo (opcional): categoría objetivo. */
  category_id?: number
  /** bogo (opcional): producto objetivo. */
  product_id?: number
  /** bogo: compra N (buy_qty) y la unidad gratis/descontada se repite cada bloque. */
  buy_qty?: number
  /** bogo: unidades con descuento por bloque. */
  get_qty?: number
}

export interface Promotion {
  id: number
  name: string
  type: PromotionType
  config: PromotionConfig
  active: boolean
  priority: number
  combinable: boolean
  starts_at: string | null
  ends_at: string | null
}

export interface CartLine {
  variant_id: number
  product_id: number
  category_id: number | null
  qty: number
  price: number
}

export interface AppliedPromotion { promotion_id: number; name: string; amount: number }
export interface PromotionResult { discount: number; applied: AppliedPromotion[] }

const round = (n: number) => Math.max(0, Math.round(n))

/** ¿La promoción está vigente ahora? Pura. */
export function isPromotionLive(p: Pick<Promotion, 'active' | 'starts_at' | 'ends_at'>, now: Date = new Date()): boolean {
  if (!p.active) return false
  const t = now.getTime()
  if (p.starts_at && t < new Date(p.starts_at).getTime()) return false
  if (p.ends_at && t >= new Date(p.ends_at).getTime()) return false
  return true
}

/** Descuento (entero, ≥0) que produce UNA promoción sobre el carrito. Pura. */
export function promotionAmount(p: Promotion, lines: CartLine[], subtotal: number): number {
  const c = p.config ?? {}
  switch (p.type) {
    case 'cart_percent': {
      if (c.min_subtotal != null && subtotal < c.min_subtotal) return 0
      return round((subtotal * (c.percent ?? 0)) / 100)
    }
    case 'cart_fixed': {
      if (c.min_subtotal != null && subtotal < c.min_subtotal) return 0
      return Math.min(round(c.amount ?? 0), subtotal)
    }
    case 'category_percent': {
      const base = lines
        .filter((l) => c.category_id != null && l.category_id === c.category_id)
        .reduce((s, l) => s + l.price * l.qty, 0)
      return round((base * (c.percent ?? 0)) / 100)
    }
    case 'bogo': {
      const buy = Math.max(1, Math.floor(c.buy_qty ?? 1))
      const get = Math.max(1, Math.floor(c.get_qty ?? 1))
      const pct = c.percent ?? 100
      // Aplica por línea elegible: por cada (buy+get) unidades, `get` llevan `pct`%.
      let amount = 0
      for (const l of lines) {
        if (c.product_id != null && l.product_id !== c.product_id) continue
        if (c.category_id != null && l.category_id !== c.category_id) continue
        if (c.product_id == null && c.category_id == null) continue // BOGO necesita objetivo
        const block = buy + get
        const freeUnits = Math.floor(l.qty / block) * get
        amount += round(l.price * freeUnits * (pct / 100))
      }
      return amount
    }
    default:
      return 0
  }
}

/**
 * Calcula el descuento total de promociones sobre el carrito. Pura.
 *  - Solo promociones vigentes.
 *  - Reglas **exclusivas** (combinable=false): si alguna aplica, gana la de MAYOR
 *    descuento y no se acumula con ninguna otra.
 *  - Si no hay exclusivas aplicables, se **suman** las combinables.
 *  - El descuento nunca supera el subtotal.
 */
export function computePromotions(
  lines: CartLine[],
  promotions: Promotion[],
  now: Date = new Date(),
): PromotionResult {
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0)
  const live = promotions
    .filter((p) => isPromotionLive(p, now))
    .sort((a, b) => a.priority - b.priority)

  const candidates = live
    .map((p) => ({ p, amount: promotionAmount(p, lines, subtotal) }))
    .filter((x) => x.amount > 0)
  if (candidates.length === 0) return { discount: 0, applied: [] }

  const exclusives = candidates.filter((x) => !x.p.combinable)
  let chosen: typeof candidates
  if (exclusives.length > 0) {
    // Gana la exclusiva de mayor descuento (desempate por prioridad = orden actual).
    const best = exclusives.reduce((a, b) => (b.amount > a.amount ? b : a))
    chosen = [best]
  } else {
    chosen = candidates
  }

  const rawDiscount = chosen.reduce((s, x) => s + x.amount, 0)
  const discount = Math.min(rawDiscount, subtotal)
  // Si el tope recortó, se prorratea proporcionalmente en los `applied`.
  const scale = rawDiscount > 0 ? discount / rawDiscount : 1
  const applied = chosen.map((x) => ({ promotion_id: x.p.id, name: x.p.name, amount: round(x.amount * scale) }))
  return { discount, applied }
}

// ── Capa de datos ─────────────────────────────────────────────────────────────

const COLS = 'id, name, type, config, active, priority, combinable, starts_at, ends_at'

export async function listPromotions(db: Db): Promise<Promotion[]> {
  const { data } = await db.from('promotions').select(COLS).order('priority', { ascending: true })
  return (data ?? []).map((p: any) => ({ ...p, config: (p.config ?? {}) as PromotionConfig })) as Promotion[]
}

/** Promociones activas (para cotizar en el storefront/checkout). */
export async function listActivePromotions(db: Db): Promise<Promotion[]> {
  const { data } = await db.from('promotions').select(COLS).eq('active', true).order('priority', { ascending: true })
  return (data ?? []).map((p: any) => ({ ...p, config: (p.config ?? {}) as PromotionConfig })) as Promotion[]
}

export interface PromotionInput {
  name: string
  type: PromotionType
  config: PromotionConfig
  combinable?: boolean
  priority?: number
  starts_at?: string | null
  ends_at?: string | null
}

export function validatePromotion(input: PromotionInput): { ok: boolean; error?: string } {
  if (!(input.name ?? '').trim()) return { ok: false, error: 'El nombre es obligatorio.' }
  const c = input.config ?? {}
  if ((input.type === 'cart_percent' || input.type === 'category_percent') && !(c.percent! > 0)) {
    return { ok: false, error: 'Indica un porcentaje mayor que 0.' }
  }
  if (input.type === 'cart_fixed' && !(c.amount! > 0)) return { ok: false, error: 'Indica un monto mayor que 0.' }
  if (input.type === 'category_percent' && c.category_id == null) return { ok: false, error: 'Elige una categoría.' }
  if (input.type === 'bogo' && c.product_id == null && c.category_id == null) {
    return { ok: false, error: 'BOGO requiere un producto o una categoría objetivo.' }
  }
  return { ok: true }
}

export async function createPromotion(input: PromotionInput, db: Db, tenantId: string): Promise<Promotion> {
  const v = validatePromotion(input)
  if (!v.ok) throw new Error(v.error)
  const { data, error } = await db
    .from('promotions')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({
      tenant_id: tenantId, name: input.name.trim(), type: input.type, config: input.config as any,
      combinable: input.combinable ?? false, priority: input.priority ?? 100,
      starts_at: input.starts_at ?? null, ends_at: input.ends_at ?? null,
    } as any)
    .select(COLS)
    .single()
  if (error) throw error
  return { ...(data as any), config: ((data as any).config ?? {}) as PromotionConfig }
}

export async function setPromotionActive(id: number, active: boolean, db: Db): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await db.from('promotions').update({ active, updated_at: new Date().toISOString() } as any).eq('id', id)
  if (error) throw error
}

export async function deletePromotion(id: number, db: Db): Promise<void> {
  const { error } = await db.from('promotions').delete().eq('id', id)
  if (error) throw error
}
