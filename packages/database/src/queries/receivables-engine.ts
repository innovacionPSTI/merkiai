/**
 * queries/receivables-engine.ts — Motor PURO de cartera (E27 · ADR-010).
 *
 * Sin BD ni red: totales de documento, plan de cuotas, aplicación de abonos,
 * estados de pago/entrega, política de entrega, edades de cartera, liquidación
 * de consignación y evento de facturación. Todo testeable en aislamiento.
 * Montos en pesos enteros (misma unidad que `orders.total`).
 */

export const MODALITIES = ['credit_sale', 'special_order', 'layaway', 'consignment'] as const
export type Modality = (typeof MODALITIES)[number]
export const isModality = (v: unknown): v is Modality => typeof v === 'string' && (MODALITIES as readonly string[]).includes(v)

export type ReceivablePaymentStatus = 'draft' | 'open' | 'partial' | 'paid' | 'overdue' | 'written_off' | 'void'
export type ReceivableDeliveryStatus = 'pending' | 'partial' | 'delivered' | 'returned'
export type DeliveryPolicy = 'require_full_payment' | 'allow_balance_on_delivery'
export type InvoiceEvent = 'on_document' | 'on_payment' | 'on_delivery' | 'on_settlement' | 'none'
export type ReceivableMovementKind = 'charge' | 'payment' | 'credit_note' | 'adjustment' | 'write_off' | 'credit_applied'

export const MODALITY_LABEL: Record<Modality, string> = {
  credit_sale: 'Venta a crédito',
  special_order: 'Encargo',
  layaway: 'Apartado',
  consignment: 'Consignación',
}

export const PAYMENT_METHODS = ['cash', 'transfer', 'card', 'link', 'pos', 'store_credit', 'other'] as const
export type ReceivablePaymentMethod = (typeof PAYMENT_METHODS)[number]

// ─── Líneas y totales ─────────────────────────────────────────────────────────

export interface LineInput {
  kind: 'item' | 'free'
  stock_item_id?: number | null
  variant_id?: number | null
  description: string
  qty: number
  unit_price: number
}

export interface NormalizedLine extends LineInput { total: number }

/** Valida y calcula el total de cada línea y del documento. Lanza con mensaje claro. */
export function normalizeLines(lines: LineInput[]): { lines: NormalizedLine[]; total: number } {
  if (!lines.length) throw new Error('Agrega al menos una línea.')
  const out = lines.map((l, i) => {
    const description = (l.description ?? '').trim()
    if (!description) throw new Error(`La línea ${i + 1} necesita una descripción.`)
    if (!(l.qty > 0)) throw new Error(`La cantidad de la línea ${i + 1} debe ser mayor a cero.`)
    if (!(l.unit_price >= 0) || !Number.isFinite(l.unit_price)) throw new Error(`El precio de la línea ${i + 1} no es válido.`)
    if (l.kind === 'item' && !l.stock_item_id) throw new Error(`La línea ${i + 1} debe indicar el producto o servicio.`)
    return { ...l, description, unit_price: Math.round(l.unit_price), total: Math.round(l.qty * l.unit_price) }
  })
  return { lines: out, total: out.reduce((s, l) => s + l.total, 0) }
}

// ─── Plan de pago ─────────────────────────────────────────────────────────────

export interface Installment { seq: number; due_date: string; amount: number }

/** Suma días/meses a una fecha ISO (YYYY-MM-DD), en UTC. */
function addInterval(date: string, step: number, unit: 'days' | 'months'): string {
  const d = new Date(`${date}T00:00:00Z`)
  if (unit === 'days') d.setUTCDate(d.getUTCDate() + step)
  else d.setUTCMonth(d.getUTCMonth() + step)
  return d.toISOString().slice(0, 10)
}

/**
 * Cuotas iguales (la última absorbe el redondeo) a partir de una primera fecha.
 * `financed` = total − anticipo (lo que se reparte en cuotas).
 */
export function buildEqualInstallments(financed: number, count: number, firstDue: string, every: { step: number; unit: 'days' | 'months' } = { step: 1, unit: 'months' }): Installment[] {
  if (!(count >= 1) || !Number.isInteger(count)) throw new Error('El número de cuotas debe ser un entero mayor a cero.')
  if (!(financed > 0)) throw new Error('No hay saldo para repartir en cuotas.')
  const base = Math.floor(financed / count)
  return Array.from({ length: count }, (_, i) => ({
    seq: i + 1,
    due_date: addInterval(firstDue, every.step * i, every.unit),
    amount: i === count - 1 ? financed - base * (count - 1) : base,
  }))
}

/** Valida cuotas personalizadas: suman lo financiado, fechas crecientes. */
export function validateCustomInstallments(financed: number, items: Array<{ due_date: string; amount: number }>): Installment[] {
  if (!items.length) throw new Error('Agrega al menos una cuota.')
  const sum = items.reduce((s, i) => s + Math.round(i.amount), 0)
  if (sum !== financed) throw new Error(`Las cuotas suman ${sum} y deben sumar ${financed}.`)
  for (let i = 1; i < items.length; i++) if (items[i].due_date < items[i - 1].due_date) throw new Error('Las fechas de las cuotas deben ir en orden.')
  return items.map((it, i) => ({ seq: i + 1, due_date: it.due_date, amount: Math.round(it.amount) }))
}

/** Anticipo mínimo efectivo (valor o % del total). */
export function minAdvanceFor(total: number, rule: { amount?: number | null; percent?: number | null }): number {
  if (rule.amount && rule.amount > 0) return Math.min(total, Math.round(rule.amount))
  if (rule.percent && rule.percent > 0) return Math.min(total, Math.round((total * rule.percent) / 100))
  return 0
}

/**
 * Estado de las cuotas según lo pagado (aplicado en orden de vencimiento).
 * Devuelve por cuota lo pagado, el pendiente y si está vencida.
 */
export function installmentProgress(installments: Installment[], paidTotal: number, today: string) {
  let remaining = Math.max(0, paidTotal)
  return installments
    .slice()
    .sort((a, b) => a.seq - b.seq)
    .map((i) => {
      const paid = Math.min(i.amount, remaining)
      remaining -= paid
      const pending = i.amount - paid
      return { ...i, paid, pending, overdue: pending > 0 && i.due_date < today }
    })
}

// ─── Estados ──────────────────────────────────────────────────────────────────

/**
 * Estado de pago derivado del libro y los vencimientos. `written_off`/`void`/`draft`
 * son estados terminales o manuales y se respetan.
 */
export function derivePaymentStatus(input: {
  current: ReceivablePaymentStatus
  charged: number
  balance: number
  dueDate?: string | null
  installments?: Installment[]
  paidTowardsInstallments?: number
  today: string
}): ReceivablePaymentStatus {
  if (input.current === 'written_off' || input.current === 'void' || input.current === 'draft') return input.current
  if (input.charged > 0 && input.balance <= 0) return 'paid'
  const instOverdue = input.installments?.length
    ? installmentProgress(input.installments, input.paidTowardsInstallments ?? 0, input.today).some((i) => i.overdue)
    : false
  const dueOverdue = !!input.dueDate && input.dueDate < input.today && input.balance > 0
  if (instOverdue || dueOverdue) return 'overdue'
  return input.charged > 0 && input.balance < input.charged ? 'partial' : 'open'
}

export function deriveDeliveryStatus(lines: Array<{ qty: number; qty_delivered: number; qty_returned?: number }>): ReceivableDeliveryStatus {
  if (!lines.length) return 'pending'
  const allReturned = lines.every((l) => (l.qty_returned ?? 0) >= l.qty)
  if (allReturned) return 'returned'
  const delivered = lines.every((l) => l.qty_delivered >= l.qty)
  if (delivered) return 'delivered'
  return lines.some((l) => l.qty_delivered > 0) ? 'partial' : 'pending'
}

// ─── Política de entrega (encargos) ───────────────────────────────────────────

export interface DeliveryCheck { ok: boolean; reason?: string; becomesCredit?: number }

/**
 * ¿Se puede entregar? `require_full_payment` exige saldo cero; `allow_balance_on_delivery`
 * permite entregar con saldo (queda como crédito), respetando el cupo si existe.
 */
export function canDeliver(input: {
  policy: DeliveryPolicy
  documentBalance: number
  partyBalance: number
  creditLimit?: number | null
}): DeliveryCheck {
  if (input.documentBalance <= 0) return { ok: true }
  if (input.policy === 'require_full_payment') {
    return { ok: false, reason: `Este encargo exige el pago completo antes de entregar (saldo pendiente: ${input.documentBalance}).` }
  }
  if (input.creditLimit != null && input.partyBalance > input.creditLimit) {
    return { ok: false, reason: `La contraparte supera su cupo de crédito (${input.creditLimit}).` }
  }
  return { ok: true, becomesCredit: input.documentBalance }
}

/** ¿Un nuevo cargo cabe en el cupo? (null = sin cupo). */
export function withinCreditLimit(partyBalance: number, newCharge: number, creditLimit?: number | null): boolean {
  return creditLimit == null || partyBalance + newCharge <= creditLimit
}

// ─── Aplicación de abonos ─────────────────────────────────────────────────────

export interface OpenItem { document_id: number; balance: number; created_at: string; line_id?: number | null }
export interface Allocation { document_id: number; amount: number; line_id?: number | null }

/**
 * Reparte un abono: primero el documento indicado (si hay), luego los más
 * antiguos. Devuelve las imputaciones y el excedente (saldo a favor).
 */
export function allocatePayment(amount: number, open: OpenItem[], preferredDocumentId?: number | null): { allocations: Allocation[]; surplus: number } {
  if (!(amount > 0)) throw new Error('El abono debe ser mayor a cero.')
  let remaining = Math.round(amount)
  const ordered = open
    .filter((o) => o.balance > 0)
    .sort((a, b) => {
      if (preferredDocumentId != null) {
        if (a.document_id === preferredDocumentId && b.document_id !== preferredDocumentId) return -1
        if (b.document_id === preferredDocumentId && a.document_id !== preferredDocumentId) return 1
      }
      return a.created_at.localeCompare(b.created_at)
    })
  const allocations: Allocation[] = []
  for (const o of ordered) {
    if (remaining <= 0) break
    const take = Math.min(o.balance, remaining)
    allocations.push({ document_id: o.document_id, amount: take, line_id: o.line_id ?? null })
    remaining -= take
  }
  return { allocations, surplus: remaining }
}

// ─── Reportes ─────────────────────────────────────────────────────────────────

export const AGING_BUCKETS = ['current', 'd1_30', 'd31_60', 'd61_90', 'd90_plus'] as const
export type AgingBucket = (typeof AGING_BUCKETS)[number]
export const AGING_LABEL: Record<AgingBucket, string> = {
  current: 'Al día', d1_30: '1–30 días', d31_60: '31–60 días', d61_90: '61–90 días', d90_plus: 'Más de 90 días',
}

const daysBetween = (from: string, to: string) =>
  Math.floor((new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) / 86_400_000)

export function agingBucket(dueDate: string | null | undefined, today: string): AgingBucket {
  if (!dueDate || dueDate >= today) return 'current'
  const d = daysBetween(dueDate, today)
  if (d <= 30) return 'd1_30'
  if (d <= 60) return 'd31_60'
  if (d <= 90) return 'd61_90'
  return 'd90_plus'
}

/** Cartera por edades: suma de saldos por tramo de vencimiento. */
export function agingReport(docs: Array<{ balance: number; due_date: string | null }>, today: string): Record<AgingBucket, number> & { total: number } {
  const out = { current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90_plus: 0, total: 0 }
  for (const d of docs) {
    if (d.balance <= 0) continue
    out[agingBucket(d.due_date, today)] += d.balance
    out.total += d.balance
  }
  return out
}

/** Liquidación de consignación: entregado, vendido, devuelto, en poder del aliado (por línea). */
export function consignmentSummary(lines: Array<{ description: string; qty: number; qty_sold: number; qty_returned: number; unit_price: number }>) {
  return lines.map((l) => {
    const onHand = Math.max(0, l.qty - l.qty_sold - l.qty_returned)
    return { ...l, onHand, soldValue: Math.round(l.qty_sold * l.unit_price), onHandValue: Math.round(onHand * l.unit_price) }
  })
}

/** Unidades que aún pueden devolverse / reportarse como vendidas en consignación. */
export function consignmentAvailable(line: { qty: number; qty_sold: number; qty_returned: number }): number {
  return Math.max(0, line.qty - line.qty_sold - line.qty_returned)
}

// ─── Facturación ──────────────────────────────────────────────────────────────

export const DEFAULT_INVOICE_EVENTS: Record<Modality, InvoiceEvent> = {
  credit_sale: 'on_delivery', special_order: 'on_delivery', layaway: 'on_settlement', consignment: 'on_settlement',
}

/** ¿Este hecho debe emitir el evento de facturación según la configuración? */
export function shouldEmitInvoice(settings: Partial<Record<Modality, InvoiceEvent>> | null | undefined, modality: Modality, happened: Exclude<InvoiceEvent, 'none'>): boolean {
  const configured = settings?.[modality] ?? DEFAULT_INVOICE_EVENTS[modality]
  return configured === happened
}

/** Número de documento legible y ordenable. */
export function formatDocumentNumber(seq: number): string {
  return `CXC-${String(seq).padStart(5, '0')}`
}
