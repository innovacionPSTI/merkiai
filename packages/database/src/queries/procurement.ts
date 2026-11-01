/**
 * queries/procurement.ts — Compras y proveedores (HU-402, E24).
 *
 * `purchaseLineTotal` / `purchaseTotal` / `costPerBase` son **puros** (testeables).
 * `receivePurchase` **recibe** una compra: por cada línea anexa un movimiento de
 * entrada ('purchase') al libro (HU-401) con su **costo por unidad base** (alimenta
 * el costeo HU-403) y marca la compra como recibida. Idempotente por `op_key`.
 */
import type { Db } from '../client'
import { recordMovement } from './stock-movements'

export interface Supplier { id: number; tenant_id?: string; name: string; email: string | null; phone: string | null; notes: string | null; active: boolean }
export interface PurchaseItem { id: number; tenant_id?: string; purchase_id: number; stock_item_id: number; qty: number; uom_id: number | null; unit_cost: number }
export interface Purchase { id: number; tenant_id?: string; supplier_id: number | null; location_id: number | null; reference: string | null; status: string; notes: string | null; received_at: string | null }

/* ───────────────────────────── helpers puros ──────────────────────────────── */

/** Total de una línea: cantidad × costo unitario (en la unidad de la línea). */
export function purchaseLineTotal(qty: number, unitCost: number): number {
  return Math.round((qty * unitCost) * 100) / 100
}

/** Total de la compra (suma de líneas). */
export function purchaseTotal(items: Array<{ qty: number; unit_cost: number }>): number {
  return Math.round(items.reduce((s, it) => s + it.qty * it.unit_cost, 0) * 100) / 100
}

/**
 * Costo por **unidad base** a partir del costo por la unidad de compra y su factor.
 * (p. ej. costo de 1 kg = 10000 y factor 1000 → costo por gramo = 10).
 */
export function costPerBase(unitCost: number, uomFactor: number): number {
  if (!(uomFactor > 0)) return unitCost
  return Math.round((unitCost / uomFactor) * 1e6) / 1e6
}

/* ─────────────────────────────── proveedores ──────────────────────────────── */

export async function listSuppliers(db: Db, activeOnly = false): Promise<Supplier[]> {
  let q = db.from('suppliers').select('*').order('name')
  if (activeOnly) q = q.eq('active', true)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as unknown as Supplier[]
}

export async function createSupplier(db: Db, input: { tenant_id?: string; name: string; email?: string | null; phone?: string | null; notes?: string | null }): Promise<Supplier> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await db.from('suppliers').insert({ ...input, name: input.name.trim() } as any).select().single()
  if (error) throw error
  return data as unknown as Supplier
}

/* ─────────────────────────────── compras ──────────────────────────────────── */

export async function listPurchases(db: Db, opts: { status?: string; limit?: number } = {}): Promise<Purchase[]> {
  let q = db.from('purchases').select('*').order('created_at', { ascending: false })
  if (opts.status) q = q.eq('status', opts.status)
  if (opts.limit) q = q.limit(opts.limit)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as unknown as Purchase[]
}

export async function getPurchaseItems(db: Db, purchaseId: number): Promise<PurchaseItem[]> {
  const { data, error } = await db.from('purchase_items').select('*').eq('purchase_id', purchaseId)
  if (error) throw error
  return (data ?? []) as unknown as PurchaseItem[]
}

export interface CreatePurchaseInput {
  tenant_id?: string
  supplier_id?: number | null
  location_id?: number | null
  reference?: string | null
  notes?: string | null
  items: Array<{ stock_item_id: number; qty: number; uom_id?: number | null; unit_cost?: number }>
}

/** Crea una compra en borrador con sus líneas. No toca stock hasta recibir. */
export async function createPurchase(db: Db, input: CreatePurchaseInput): Promise<Purchase> {
  const header = {
    tenant_id: input.tenant_id,
    supplier_id: input.supplier_id ?? null,
    location_id: input.location_id ?? null,
    reference: input.reference ?? null,
    notes: input.notes ?? null,
    status: 'draft',
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: p, error } = await db.from('purchases').insert(header as any).select().single()
  if (error || !p) throw error ?? new Error('[procurement] no se creó la compra')
  const purchase = p as unknown as Purchase
  if (input.items.length) {
    const rows = input.items.map((it) => ({
      tenant_id: input.tenant_id,
      purchase_id: purchase.id,
      stock_item_id: it.stock_item_id,
      qty: it.qty,
      uom_id: it.uom_id ?? null,
      unit_cost: it.unit_cost ?? 0,
    }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: iErr } = await db.from('purchase_items').insert(rows as any)
    if (iErr) throw iErr
  }
  return purchase
}

/**
 * Recibe una compra: anexa un movimiento de entrada por cada línea (idempotente
 * por `op_key = purchase:<id>:<itemId>`) con el costo por unidad base, y marca la
 * compra como `received`. `uomFactorOf` resuelve el factor de la UoM de cada línea
 * (el llamador lo provee; típicamente un mapa uom_id→factor cargado antes).
 */
export async function receivePurchase(
  db: Db,
  purchaseId: number,
  tenantId: string,
  uomFactorOf: (uomId: number | null) => number,
): Promise<{ received: number }> {
  const items = await getPurchaseItems(db, purchaseId)
  let received = 0
  for (const it of items) {
    const factor = uomFactorOf(it.uom_id)
    await recordMovement(db, {
      tenant_id: tenantId,
      stock_item_id: it.stock_item_id,
      movement_type: 'purchase',
      qty: it.qty,
      uom_id: it.uom_id,
      uom_factor: factor,
      unit_cost: costPerBase(it.unit_cost, factor),
      ref_type: 'purchase',
      ref_id: String(purchaseId),
      op_key: `purchase:${purchaseId}:${it.id}`,
      reason: 'Recepción de compra',
    })
    received++
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await db.from('purchases').update({ status: 'received', received_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any).eq('id', purchaseId)
  return { received }
}
