/**
 * queries/quotes.ts — Cotizaciones (HU-408 Fase 1, E24).
 *
 * `quoteLineTotal`, `quoteTotals`, `isQuoteExpired` y `canConvertQuote` son
 * **puros** (sin BD): calculan totales y resuelven el ciclo de vida/caducidad de
 * una cotización. Las funciones de BD hacen el CRUD tenant-scoped. La reserva de
 * stock (ledger), los abonos (pagos) y la conversión a orden son Fase 2.
 */
import type { Db } from '../client'
import type { OrderItem, Order } from '../types'
import { createOrder } from './orders'

export const QUOTE_STATUSES = ['draft', 'sent', 'accepted', 'converted', 'expired', 'cancelled'] as const
export type QuoteStatus = (typeof QUOTE_STATUSES)[number]

export function isQuoteStatus(v: unknown): v is QuoteStatus {
  return typeof v === 'string' && (QUOTE_STATUSES as readonly string[]).includes(v)
}

export interface QuoteItem {
  id?: number
  tenant_id?: string
  quote_id?: number
  product_id: number | null
  variant_id: number | null
  name: string
  qty: number
  unit_price: number
  line_total: number
}

export interface Quote {
  id: number
  tenant_id?: string
  quote_number: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  status: QuoteStatus
  subtotal: number
  discount: number
  total: number
  valid_until: string | null
  notes: string | null
  converted_order_id: number | null
  created_at?: string
  updated_at?: string
}

/* ───────────────────────────── Puros ──────────────────────────────────────── */

const round2 = (n: number) => Math.round(n * 100) / 100

export function quoteLineTotal(qty: number, unitPrice: number): number {
  return round2(Math.max(0, qty) * Math.max(0, unitPrice))
}

/** Totales de una cotización a partir de sus líneas y un descuento (tope: subtotal). */
export function quoteTotals(
  items: Array<{ qty: number; unit_price: number }>,
  discount = 0,
): { subtotal: number; discount: number; total: number } {
  const subtotal = round2(items.reduce((s, it) => s + quoteLineTotal(it.qty, it.unit_price), 0))
  const d = round2(Math.min(Math.max(0, discount), subtotal))
  return { subtotal, discount: d, total: round2(subtotal - d) }
}

/** ¿La cotización está vencida a la fecha dada? (sin `valid_until` nunca vence). */
export function isQuoteExpired(validUntil: string | null, now: Date = new Date()): boolean {
  if (!validUntil) return false
  const t = Date.parse(validUntil)
  return Number.isFinite(t) && t < now.getTime()
}

/** ¿Se puede convertir a orden? Devuelve `null` si sí, o el motivo si no. */
export function canConvertQuote(
  quote: Pick<Quote, 'status' | 'valid_until'>,
  now: Date = new Date(),
): string | null {
  if (quote.status === 'converted') return 'La cotización ya fue convertida'
  if (quote.status === 'cancelled') return 'La cotización está cancelada'
  if (quote.status === 'expired' || isQuoteExpired(quote.valid_until, now)) return 'La cotización está vencida'
  return null
}

/** Mapea las líneas de una cotización a ítems de orden (puro). Las líneas sin
 *  variante usan `variant_id` 0 (sentinela: no enlaza stock ni descuenta). */
export function quoteItemsToOrderItems(items: QuoteItem[]): OrderItem[] {
  return items.map((it) => ({
    variant_id: it.variant_id ?? 0,
    product_name: it.name,
    variant_label: '',
    qty: it.qty,
    price: it.unit_price,
  }))
}

/* ───────────────────────────── BD ─────────────────────────────────────────── */

export async function listQuotes(db: Db, opts: { status?: QuoteStatus; limit?: number } = {}): Promise<Quote[]> {
  let q = db.from('quotes').select('*').order('created_at', { ascending: false })
  if (opts.status) q = q.eq('status', opts.status)
  if (opts.limit) q = q.limit(opts.limit)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as unknown as Quote[]
}

export async function getQuote(db: Db, id: number): Promise<{ quote: Quote; items: QuoteItem[] } | null> {
  const { data: quote } = await db.from('quotes').select('*').eq('id', id).maybeSingle()
  if (!quote) return null
  const { data: items } = await db.from('quote_items').select('*').eq('quote_id', id).order('id')
  return { quote: quote as unknown as Quote, items: (items ?? []) as unknown as QuoteItem[] }
}

export interface CreateQuoteInput {
  tenant_id?: string
  quote_number: string
  customer_name?: string
  customer_email?: string
  customer_phone?: string | null
  valid_until?: string | null
  notes?: string | null
  discount?: number
  items: Array<{ product_id?: number | null; variant_id?: number | null; name: string; qty: number; unit_price: number }>
}

/** Crea una cotización con sus líneas; calcula totales con `quoteTotals` (puro). */
export async function createQuote(db: Db, input: CreateQuoteInput): Promise<Quote> {
  const lines = input.items.map((it) => ({
    product_id: it.product_id ?? null,
    variant_id: it.variant_id ?? null,
    name: it.name.trim(),
    qty: it.qty,
    unit_price: it.unit_price,
    line_total: quoteLineTotal(it.qty, it.unit_price),
  }))
  const totals = quoteTotals(lines, input.discount ?? 0)

  const header = {
    tenant_id: input.tenant_id,
    quote_number: input.quote_number.trim(),
    customer_name: input.customer_name?.trim() ?? '',
    customer_email: input.customer_email?.trim() ?? '',
    customer_phone: input.customer_phone?.trim() || null,
    status: 'draft' as QuoteStatus,
    subtotal: totals.subtotal,
    discount: totals.discount,
    total: totals.total,
    valid_until: input.valid_until ?? null,
    notes: input.notes?.trim() || null,
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: quote, error } = await db.from('quotes').insert(header as any).select().single()
  if (error) throw error
  const q = quote as unknown as Quote

  if (lines.length) {
    const rows = lines.map((l) => ({ ...l, tenant_id: input.tenant_id, quote_id: q.id }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: e2 } = await db.from('quote_items').insert(rows as any)
    if (e2) throw e2
  }
  return q
}

/** Cambia el estado de una cotización (valida la transición en el llamador). */
export async function updateQuoteStatus(db: Db, id: number, status: QuoteStatus): Promise<Quote> {
  const { data, error } = await db
    .from('quotes')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ status, updated_at: new Date().toISOString() } as any)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as unknown as Quote
}

/**
 * Convierte una cotización en una **orden** (HU-408 AC-1): reusa el modelo de
 * orden (`createOrder`, pago `manual`, estado `pending`) con las líneas y totales
 * de la cotización, y marca la cotización `converted` con `converted_order_id`.
 * Lanza si la cotización no es convertible (vencida/cancelada/ya convertida).
 */
export async function convertQuoteToOrder(db: Db, quoteId: number): Promise<{ quote: Quote; order: Order }> {
  const found = await getQuote(db, quoteId)
  if (!found) throw new Error('Cotización no encontrada')
  const reason = canConvertQuote(found.quote)
  if (reason) throw new Error(reason)

  const q = found.quote
  const order = await createOrder({
    tenant_id: q.tenant_id,
    customer_name: q.customer_name || 'Cliente',
    customer_email: q.customer_email || '',
    customer_phone: q.customer_phone ?? undefined,
    shipping_addr: { address: '', city: '', department: '' },
    items: quoteItemsToOrderItems(found.items),
    subtotal: q.subtotal,
    shipping_cost: 0,
    discount: q.discount,
    total: q.total,
    payment_method: 'manual',
    payment_status: 'pending',
  }, db)

  const { data, error } = await db
    .from('quotes')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ status: 'converted', converted_order_id: order.id, updated_at: new Date().toISOString() } as any)
    .eq('id', quoteId)
    .select()
    .single()
  if (error) throw error
  return { quote: data as unknown as Quote, order }
}
