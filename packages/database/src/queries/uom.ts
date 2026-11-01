/**
 * queries/uom.ts — Unidades de medida e ítems de inventario (HU-400, E24).
 *
 * Helpers **puros** (sin BD) de conversión de cantidades y validación, usados por
 * el motor de inventario/costeo. La unidad de medida convierte a la **unidad base**
 * de su dimensión mediante `to_base_factor` (base = factor 1); dos unidades solo
 * son convertibles entre sí si comparten dimensión.
 */
import { slugifyKey } from './blueprint'

export const ITEM_CLASSES = ['materia_prima', 'insumo', 'terminado', 'servicio'] as const
export type ItemClass = (typeof ITEM_CLASSES)[number]

export const UOM_DIMENSIONS = ['count', 'weight', 'volume', 'length'] as const
export type UomDimension = (typeof UOM_DIMENSIONS)[number]

export interface Uom {
  id: number
  tenant_id?: string
  code: string
  name: string
  dimension: UomDimension
  to_base_factor: number
}

export interface StockItem {
  id: number
  tenant_id?: string
  key: string
  name: string
  item_class: ItemClass
  uom_id: number | null
  sellable: boolean
  active: boolean
}

export { slugifyKey }

export function isItemClass(v: unknown): v is ItemClass {
  return typeof v === 'string' && (ITEM_CLASSES as readonly string[]).includes(v)
}

export function isUomDimension(v: unknown): v is UomDimension {
  return typeof v === 'string' && (UOM_DIMENSIONS as readonly string[]).includes(v)
}

/** Redondea una cantidad a `places` decimales (default 6), evitando ruido float. */
export function normalizeQty(qty: number, places = 6): number {
  if (!Number.isFinite(qty)) return 0
  const f = 10 ** places
  return Math.round(qty * f) / f
}

/** Convierte una cantidad a la unidad base de su dimensión. */
export function toBase(qty: number, factor: number): number {
  return normalizeQty(qty * factor)
}

/** Convierte una cantidad desde la unidad base a una unidad con `factor`. */
export function fromBase(qtyBase: number, factor: number): number {
  if (!(factor > 0)) throw new Error('[uom] factor debe ser > 0')
  return normalizeQty(qtyBase / factor)
}

/**
 * Convierte una cantidad entre dos unidades de la **misma dimensión**. Lanza si
 * las dimensiones difieren (p. ej. no se puede pasar de gramos a mililitros).
 */
export function convertUom(qty: number, from: Pick<Uom, 'dimension' | 'to_base_factor'>, to: Pick<Uom, 'dimension' | 'to_base_factor'>): number {
  if (from.dimension !== to.dimension) {
    throw new Error(`[uom] dimensiones incompatibles: ${from.dimension} → ${to.dimension}`)
  }
  return fromBase(toBase(qty, from.to_base_factor), to.to_base_factor)
}

/**
 * Normaliza la entrada de un stock_item (pura): slugifica la key, valida clase
 * (default 'terminado'), y asegura `sellable` coherente. Devuelve `null` si falta
 * nombre o key resultante vacía.
 */
export function normalizeStockItemInput(input: {
  key?: string; name?: string; item_class?: string; uom_id?: number | null; sellable?: boolean; active?: boolean
}): { key: string; name: string; item_class: ItemClass; uom_id: number | null; sellable: boolean; active: boolean } | null {
  const name = String(input.name ?? '').trim()
  const key = slugifyKey(String(input.key ?? name))
  if (!name || !key) return null
  const item_class: ItemClass = isItemClass(input.item_class) ? input.item_class : 'terminado'
  // Solo 'terminado' y 'servicio' son vendibles por defecto; materia prima/insumo no.
  const sellableDefault = item_class === 'terminado' || item_class === 'servicio'
  return {
    key,
    name,
    item_class,
    uom_id: typeof input.uom_id === 'number' ? input.uom_id : null,
    sellable: input.sellable ?? sellableDefault,
    active: input.active ?? true,
  }
}
