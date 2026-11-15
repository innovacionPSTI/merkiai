/**
 * queries/receivables.ts — Cartera operativa sobre la BD (E27 · ADR-010).
 *
 * Orquesta el motor puro (`receivables-engine`) con:
 *   · el LIBRO de cartera (`receivable_movements`, append-only, idempotente por op_key),
 *   · el libro de inventario (ventas, reservas y transferencias a la ubicación del aliado),
 *   · el crédito en tienda (saldo a favor) y la bandeja de eventos de facturación.
 * El saldo SIEMPRE es proyección del libro; nunca se escribe un saldo.
 * Todas las funciones reciben un cliente acotado por RLS al tenant (admin).
 */
import type { Db } from '../client'
import {
  normalizeLines, buildEqualInstallments, validateCustomInstallments, allocatePayment,
  derivePaymentStatus, deriveDeliveryStatus, canDeliver, withinCreditLimit, shouldEmitInvoice,
  consignmentAvailable, formatDocumentNumber, agingReport, installmentProgress, DEFAULT_INVOICE_EVENTS,
  type LineInput, type Modality, type DeliveryPolicy, type InvoiceEvent, type Installment, type ReceivablePaymentStatus,
  type ReceivableDeliveryStatus, type ReceivablePaymentMethod, type ReceivableMovementKind,
} from './receivables-engine'
import { recordMovement } from './stock-movements'
import { createTransfer, receiveTransfer } from './stock-transfer'
import { addStoreCredit } from './gift-cards'
import { createProductionOrder } from './production'
import { listPriceLists, resolveEffectivePrice, type PriceListItem } from './price-lists'

// Tablas nuevas (e17/76) aún no están en los tipos generados.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const t = (db: Db) => db as any
const today = (now = new Date()) => now.toISOString().slice(0, 10)
function fail(op: string, error: { message: string } | null | undefined): void {
  if (error) throw new Error(`[cartera] ${op}: ${error.message}`)
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ReceivablesSettings {
  delivery_policy: DeliveryPolicy
  invoice_events: Partial<Record<Modality, InvoiceEvent>>
  layaway_days: number
  reminder_days_before: number
  reminder_days_after: number
  reminders_enabled: boolean
}
export const DEFAULT_RECEIVABLES_SETTINGS: ReceivablesSettings = {
  delivery_policy: 'require_full_payment', invoice_events: DEFAULT_INVOICE_EVENTS,
  layaway_days: 30, reminder_days_before: 3, reminder_days_after: 3, reminders_enabled: false,
}

export interface Party {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  party_role: 'customer' | 'consignee'
  credit_limit: number | null
  default_terms_days: number | null
  document_id: string | null
  balance?: number
}

export interface ReceivableDocument {
  id: number
  tenant_id: string
  number: string
  party_id: string
  modality: Modality
  payment_status: ReceivablePaymentStatus
  delivery_status: ReceivableDeliveryStatus
  total: number
  plan_type: 'free' | 'installments'
  due_date: string | null
  min_advance: number
  delivery_policy: DeliveryPolicy | null
  location_id: number | null
  reservation_expires_at: string | null
  notes: string | null
  created_at: string
}

export interface ReceivableLine {
  id: number
  document_id: number
  kind: 'item' | 'free'
  stock_item_id: number | null
  variant_id: number | null
  description: string
  qty: number
  unit_price: number
  total: number
  qty_delivered: number
  qty_returned: number
  qty_sold: number
}

export interface ReceivableMovement {
  id: number
  party_id: string
  document_id: number | null
  line_id: number | null
  type: ReceivableMovementKind
  delta: number
  method: string | null
  reference: string | null
  note: string | null
  created_at: string
}

// ─── Ajustes ──────────────────────────────────────────────────────────────────

export async function getReceivablesSettings(db: Db, tenantId: string): Promise<ReceivablesSettings> {
  const { data } = await t(db).from('receivables_settings').select('*').eq('tenant_id', tenantId).maybeSingle()
  if (!data) return { ...DEFAULT_RECEIVABLES_SETTINGS }
  return { ...DEFAULT_RECEIVABLES_SETTINGS, ...data, invoice_events: { ...DEFAULT_INVOICE_EVENTS, ...(data.invoice_events ?? {}) } }
}

export async function saveReceivablesSettings(db: Db, tenantId: string, s: Partial<ReceivablesSettings>): Promise<void> {
  const { error } = await t(db).from('receivables_settings').upsert({ tenant_id: tenantId, ...s, updated_at: new Date().toISOString() }, { onConflict: 'tenant_id' })
  fail('ajustes', error)
}

// ─── Contrapartes ─────────────────────────────────────────────────────────────

const PARTY_COLS = 'id, name, email, phone, party_role, credit_limit, default_terms_days, document_id'

export async function listParties(db: Db, opts: { role?: 'customer' | 'consignee'; search?: string; withBalance?: boolean } = {}): Promise<Party[]> {
  let q = t(db).from('customers').select(PARTY_COLS).order('name', { ascending: true }).limit(500)
  if (opts.role) q = q.eq('party_role', opts.role)
  if (opts.search?.trim()) q = q.or(`name.ilike.%${opts.search.trim().replace(/[%,()]/g, '')}%,email.ilike.%${opts.search.trim().replace(/[%,()]/g, '')}%`)
  const { data, error } = await q
  fail('contrapartes', error)
  const parties = (data ?? []) as Party[]
  if (!opts.withBalance || !parties.length) return parties
  const { data: bal } = await t(db).from('receivable_party_balances').select('party_id, balance').in('party_id', parties.map((p) => p.id))
  const map = new Map<string, number>(((bal ?? []) as Array<{ party_id: string; balance: number }>).map((b) => [b.party_id, Number(b.balance)]))
  return parties.map((p) => ({ ...p, balance: map.get(p.id) ?? 0 }))
}

export async function getParty(db: Db, id: string): Promise<Party | null> {
  const { data, error } = await t(db).from('customers').select(PARTY_COLS).eq('id', id).maybeSingle()
  fail('contraparte', error)
  return (data as Party) ?? null
}

export async function savePartyCredit(db: Db, id: string, patch: Partial<Pick<Party, 'party_role' | 'credit_limit' | 'default_terms_days' | 'document_id' | 'phone' | 'name'>>): Promise<void> {
  const { error } = await t(db).from('customers').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id)
  fail('actualizar contraparte', error)
}

export async function createParty(
  db: Db,
  tenantId: string,
  input: { name: string; email?: string | null; phone?: string | null; party_role?: 'customer' | 'consignee'; credit_limit?: number | null; default_terms_days?: number | null; document_id?: string | null },
): Promise<Party> {
  const name = input.name?.trim()
  if (!name) throw new Error('El nombre es obligatorio.')
  const email = input.email?.trim().toLowerCase() || null
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('El correo no es válido.')
  const { data, error } = await t(db).from('customers').insert({
    tenant_id: tenantId, name, email, phone: input.phone?.trim() || null, party_role: input.party_role ?? 'customer',
    credit_limit: input.credit_limit ?? null, default_terms_days: input.default_terms_days ?? null, document_id: input.document_id?.trim() || null,
  }).select(PARTY_COLS).single()
  if (error?.code === '23505') throw new Error('Ya existe una contraparte con ese correo.')
  fail('crear contraparte', error)
  return data as Party
}

export async function getPartyBalance(db: Db, partyId: string): Promise<number> {
  const { data } = await t(db).from('receivable_party_balances').select('balance').eq('party_id', partyId).maybeSingle()
  return Number(data?.balance ?? 0)
}

// ─── Libro y estado ───────────────────────────────────────────────────────────

async function appendMovement(db: Db, tenantId: string, m: {
  party_id: string; document_id?: number | null; line_id?: number | null; type: ReceivableMovementKind; delta: number
  method?: string | null; reference?: string | null; note?: string | null; op_key?: string | null; created_by?: string | null
}): Promise<{ deduped: boolean }> {
  if (!m.delta) return { deduped: false }
  const { error } = await t(db).from('receivable_movements').insert({ tenant_id: tenantId, ...m, delta: Math.round(m.delta) })
  if (error?.code === '23505') return { deduped: true } // misma op_key → ya aplicado
  fail('movimiento', error)
  return { deduped: false }
}

export async function getDocumentBalance(db: Db, documentId: number): Promise<{ charged: number; credited: number; balance: number }> {
  const { data } = await t(db).from('receivable_document_balances').select('charged, credited, balance').eq('document_id', documentId).maybeSingle()
  return { charged: Number(data?.charged ?? 0), credited: Number(data?.credited ?? 0), balance: Number(data?.balance ?? 0) }
}

async function loadDoc(db: Db, id: number): Promise<ReceivableDocument> {
  const { data, error } = await t(db).from('receivable_documents').select('*').eq('id', id).maybeSingle()
  fail('documento', error)
  if (!data) throw new Error('Documento no encontrado.')
  return data as ReceivableDocument
}
async function loadLines(db: Db, documentId: number): Promise<ReceivableLine[]> {
  const { data, error } = await t(db).from('receivable_lines').select('*').eq('document_id', documentId).order('id')
  fail('líneas', error)
  return ((data ?? []) as ReceivableLine[]).map((l) => ({ ...l, qty: Number(l.qty), qty_delivered: Number(l.qty_delivered), qty_returned: Number(l.qty_returned), qty_sold: Number(l.qty_sold) }))
}
async function loadInstallments(db: Db, documentId: number): Promise<Installment[]> {
  const { data } = await t(db).from('receivable_installments').select('seq, due_date, amount').eq('document_id', documentId).order('seq')
  return (data ?? []) as Installment[]
}

/** Recalcula estados de pago y entrega desde el libro y las líneas. */
export async function refreshDocumentStatus(db: Db, documentId: number, now = new Date()): Promise<ReceivableDocument> {
  const doc = await loadDoc(db, documentId)
  const [bal, lines, inst] = await Promise.all([getDocumentBalance(db, documentId), loadLines(db, documentId), loadInstallments(db, documentId)])
  const payment_status = derivePaymentStatus({
    current: doc.payment_status, charged: bal.charged, balance: bal.balance, dueDate: doc.due_date,
    installments: inst, paidTowardsInstallments: Math.max(0, bal.charged - bal.balance) - (bal.charged - inst.reduce((s, i) => s + i.amount, 0)),
    today: today(now),
  })
  const delivery_status = deriveDeliveryStatus(lines)
  if (payment_status !== doc.payment_status || delivery_status !== doc.delivery_status) {
    const { error } = await t(db).from('receivable_documents').update({ payment_status, delivery_status, updated_at: now.toISOString() }).eq('id', documentId)
    fail('estado', error)
  }
  return { ...doc, payment_status, delivery_status }
}

async function emitInvoiceIfConfigured(db: Db, tenantId: string, doc: ReceivableDocument, event: Exclude<InvoiceEvent, 'none'>, amount: number, opKey: string): Promise<void> {
  const settings = await getReceivablesSettings(db, tenantId)
  if (!shouldEmitInvoice(settings.invoice_events, doc.modality, event)) return
  const { error } = await t(db).from('receivable_invoice_events').insert({
    tenant_id: tenantId, document_id: doc.id, event, amount, op_key: opKey,
    payload: { number: doc.number, modality: doc.modality, party_id: doc.party_id, total: doc.total },
  })
  if (error && error.code !== '23505') fail('evento de facturación', error)
}

// ─── Inventario de las líneas ─────────────────────────────────────────────────

/** Ítems físicos (excluye la clase `servicio`, que no mueve inventario). */
async function physicalItems(db: Db, ids: number[]): Promise<Set<number>> {
  if (!ids.length) return new Set()
  const { data } = await t(db).from('stock_items').select('id, item_class').in('id', ids)
  return new Set(((data ?? []) as Array<{ id: number; item_class: string }>).filter((i) => i.item_class !== 'servicio').map((i) => i.id))
}

async function stockMove(db: Db, tenantId: string, doc: ReceivableDocument, line: ReceivableLine, qty: number, kind: 'sale' | 'reserve' | 'release', locationId: number | null, opKey: string) {
  await recordMovement(db, {
    tenant_id: tenantId, stock_item_id: line.stock_item_id!, location_id: locationId,
    movement_type: kind, qty,
    reason: `${kind === 'sale' ? 'Venta' : kind === 'reserve' ? 'Apartado (reserva)' : 'Apartado (liberación)'} ${doc.number}`,
    ref_type: 'receivable', ref_id: String(doc.id), op_key: opKey,
  })
}

// ─── Crear documento ──────────────────────────────────────────────────────────

export interface CreateDocumentInput {
  party_id: string
  modality: Modality
  lines: LineInput[]
  plan?: { type: 'free'; due_date?: string | null } | { type: 'installments'; count?: number; first_due?: string; every?: { step: number; unit: 'days' | 'months' }; custom?: Array<{ due_date: string; amount: number }> }
  min_advance?: number
  advance?: { amount: number; method: ReceivablePaymentMethod; reference?: string | null } | null
  delivery_policy?: DeliveryPolicy | null
  /** Ubicación de origen del inventario (venta/reserva/despacho a consignación). */
  location_id?: number | null
  /** Consignación: ubicación del aliado (tipo `consignment`). */
  consignee_location_id?: number | null
  notes?: string | null
  created_by?: string | null
  op_key?: string | null
}

async function nextNumber(db: Db): Promise<string> {
  const { count } = await t(db).from('receivable_documents').select('id', { count: 'exact', head: true })
  return formatDocumentNumber((count ?? 0) + 1)
}

export async function createReceivableDocument(db: Db, tenantId: string, input: CreateDocumentInput, now = new Date()): Promise<ReceivableDocument> {
  const party = await getParty(db, input.party_id)
  if (!party) throw new Error('Contraparte no encontrada.')
  const { lines, total } = normalizeLines(input.lines)
  if (total <= 0) throw new Error('El total del documento debe ser mayor a cero.')

  const advance = Math.round(input.advance?.amount ?? 0)
  if (advance < 0 || advance > total) throw new Error('El anticipo no puede superar el total.')
  const minAdvance = Math.round(input.min_advance ?? 0)
  if (minAdvance > 0 && advance < minAdvance) throw new Error(`Este documento exige un anticipo mínimo de ${minAdvance}.`)

  // Cupo: la deuda que queda abierta no puede superar el cupo de la contraparte.
  const partyBalance = await getPartyBalance(db, party.id)
  if (!withinCreditLimit(partyBalance, total - advance, party.credit_limit)) {
    throw new Error(`La operación supera el cupo de crédito de ${party.name ?? 'la contraparte'} (${party.credit_limit}).`)
  }

  if (input.modality === 'consignment') {
    if (!input.consignee_location_id) throw new Error('Elige la ubicación del aliado para la consignación.')
    if (!input.location_id) throw new Error('Elige la ubicación de origen de la mercancía.')
    if (lines.some((l) => l.kind !== 'item')) throw new Error('La consignación solo admite productos del inventario.')
  }

  // Plan de pago
  const financed = total - advance
  let installments: Installment[] = []
  let dueDate: string | null = null
  const plan = input.plan ?? { type: 'free' as const }
  if (plan.type === 'installments' && financed > 0) {
    installments = plan.custom?.length
      ? validateCustomInstallments(financed, plan.custom)
      : buildEqualInstallments(financed, plan.count ?? 1, plan.first_due ?? today(now), plan.every)
    dueDate = installments[installments.length - 1].due_date
  } else if (plan.type === 'free') {
    dueDate = plan.due_date ?? (party.default_terms_days ? new Date(now.getTime() + party.default_terms_days * 86_400_000).toISOString().slice(0, 10) : null)
  }

  const settings = await getReceivablesSettings(db, tenantId)
  const reservation_expires_at = input.modality === 'layaway' ? new Date(now.getTime() + settings.layaway_days * 86_400_000).toISOString() : null

  // Documento (con reintento ante choque de numeración concurrente)
  let doc: ReceivableDocument | null = null
  for (let attempt = 0; attempt < 3 && !doc; attempt++) {
    const number = await nextNumber(db)
    const { data, error } = await t(db).from('receivable_documents').insert({
      tenant_id: tenantId, number: attempt ? `${number}-${attempt}` : number, party_id: party.id, modality: input.modality,
      total, plan_type: plan.type === 'installments' && financed > 0 ? 'installments' : 'free', due_date: dueDate,
      min_advance: minAdvance, delivery_policy: input.delivery_policy ?? null,
      location_id: input.modality === 'consignment' ? input.consignee_location_id : (input.location_id ?? null),
      reservation_expires_at, notes: input.notes?.trim() || null, created_by: input.created_by ?? null,
    }).select('*').single()
    if (error?.code === '23505') continue
    fail('crear documento', error)
    doc = data as ReceivableDocument
  }
  if (!doc) throw new Error('No se pudo numerar el documento; intenta de nuevo.')

  const { data: insertedLines, error: le } = await t(db).from('receivable_lines').insert(lines.map((l) => ({
    tenant_id: tenantId, document_id: doc!.id, kind: l.kind, stock_item_id: l.stock_item_id ?? null, variant_id: l.variant_id ?? null,
    description: l.description, qty: l.qty, unit_price: l.unit_price, total: l.total,
  }))).select('*')
  fail('crear líneas', le)
  const docLines = (insertedLines ?? []) as ReceivableLine[]

  if (installments.length) {
    const { error } = await t(db).from('receivable_installments').insert(installments.map((i) => ({ tenant_id: tenantId, document_id: doc!.id, ...i })))
    fail('cuotas', error)
  }

  // Cargo: la deuda nace al crear (crédito/encargo/apartado) o al entregar (consignación = ahora).
  await appendMovement(db, tenantId, { party_id: party.id, document_id: doc.id, type: 'charge', delta: total, note: `Cargo ${doc.number}`, op_key: `rdoc:${doc.id}:charge`, created_by: input.created_by })

  // Inventario según modalidad
  const physical = await physicalItems(db, docLines.filter((l) => l.kind === 'item' && l.stock_item_id).map((l) => l.stock_item_id!))
  for (const line of docLines) {
    if (line.kind !== 'item' || !line.stock_item_id) continue
    const isPhysical = physical.has(line.stock_item_id)
    if (input.modality === 'credit_sale') {
      if (isPhysical) await stockMove(db, tenantId, doc, line, Number(line.qty), 'sale', input.location_id ?? null, `rdoc:${doc.id}:line:${line.id}:sale`)
      await t(db).from('receivable_lines').update({ qty_delivered: line.qty }).eq('id', line.id)
    } else if (input.modality === 'layaway' && isPhysical) {
      await stockMove(db, tenantId, doc, line, Number(line.qty), 'reserve', input.location_id ?? null, `rdoc:${doc.id}:line:${line.id}:reserve`)
    } else if (input.modality === 'consignment') {
      if (isPhysical) {
        const tr = await createTransfer(db, { tenant_id: tenantId, stock_item_id: line.stock_item_id, from_location_id: input.location_id!, to_location_id: input.consignee_location_id!, qty: Number(line.qty), note: `Consignación ${doc.number}` })
        await receiveTransfer(db, tr.id)
      }
      await t(db).from('receivable_lines').update({ qty_delivered: line.qty }).eq('id', line.id)
    }
  }

  await emitInvoiceIfConfigured(db, tenantId, doc, 'on_document', total, `rdoc:${doc.id}:inv:document`)
  if (input.modality === 'credit_sale' || input.modality === 'consignment') {
    await emitInvoiceIfConfigured(db, tenantId, doc, 'on_delivery', total, `rdoc:${doc.id}:inv:delivery`)
  }

  if (advance > 0) {
    await registerPayment(db, tenantId, {
      party_id: party.id, document_id: doc.id, amount: advance, method: input.advance!.method, reference: input.advance?.reference ?? null,
      note: 'Anticipo', op_key: `rdoc:${doc.id}:advance`, created_by: input.created_by,
    }, now)
  }
  return refreshDocumentStatus(db, doc.id, now)
}

// ─── Abonos ───────────────────────────────────────────────────────────────────

export interface PaymentInput {
  party_id: string
  amount: number
  method: ReceivablePaymentMethod
  reference?: string | null
  note?: string | null
  /** Documento al que se imputa primero (si no, al más antiguo). */
  document_id?: number | null
  /** Línea concreta (p. ej. anticipo por producto). */
  line_id?: number | null
  op_key?: string | null
  created_by?: string | null
}

export interface PaymentResult { applied: Array<{ document_id: number; amount: number }>; surplus: number; deduped: boolean }

export async function registerPayment(db: Db, tenantId: string, input: PaymentInput, now = new Date()): Promise<PaymentResult> {
  const opKey = input.op_key ?? `pay:${input.party_id}:${now.getTime()}:${Math.round(input.amount)}`
  const { data: docs, error } = await t(db).from('receivable_documents')
    .select('id, created_at, payment_status').eq('party_id', input.party_id).not('payment_status', 'in', '(void,written_off,draft)')
  fail('documentos abiertos', error)
  const ids = ((docs ?? []) as Array<{ id: number }>).map((d) => d.id)
  const { data: bals } = ids.length ? await t(db).from('receivable_document_balances').select('document_id, balance').in('document_id', ids) : { data: [] }
  const balMap = new Map<number, number>(((bals ?? []) as Array<{ document_id: number; balance: number }>).map((b) => [b.document_id, Number(b.balance)]))
  const open = ((docs ?? []) as Array<{ id: number; created_at: string }>).map((d) => ({
    document_id: d.id, created_at: d.created_at, balance: balMap.get(d.id) ?? 0,
    line_id: input.document_id === d.id ? input.line_id ?? null : null,
  }))

  const { allocations, surplus } = allocatePayment(input.amount, open, input.document_id)
  let deduped = false
  for (const a of allocations) {
    const r = await appendMovement(db, tenantId, {
      party_id: input.party_id, document_id: a.document_id, line_id: a.line_id ?? null, type: 'payment', delta: -a.amount,
      method: input.method, reference: input.reference ?? null, note: input.note ?? null, op_key: `${opKey}:${a.document_id}`, created_by: input.created_by,
    })
    deduped = deduped || r.deduped
    if (r.deduped) continue
    const doc = await refreshDocumentStatus(db, a.document_id, now)
    await emitInvoiceIfConfigured(db, tenantId, doc, 'on_payment', a.amount, `${opKey}:${a.document_id}:inv`)
    if (doc.payment_status === 'paid') await onSettled(db, tenantId, doc)
  }
  if (surplus > 0 && !deduped) {
    // Saldo a favor → crédito en tienda (HU-148), usable en la tienda y el POS.
    await addStoreCredit({ customerId: input.party_id, delta: surplus, reason: `Saldo a favor (cartera) ${input.reference ?? ''}`.trim() }, db, tenantId)
  }
  return { applied: allocations, surplus, deduped }
}

/** Al quedar saldado: apartado → convierte la reserva en venta; evento de facturación. */
async function onSettled(db: Db, tenantId: string, doc: ReceivableDocument): Promise<void> {
  if (doc.modality === 'layaway') {
    const lines = await loadLines(db, doc.id)
    const physical = await physicalItems(db, lines.filter((l) => l.stock_item_id).map((l) => l.stock_item_id!))
    for (const line of lines) {
      if (line.kind !== 'item' || !line.stock_item_id || line.qty_delivered >= line.qty) continue
      if (physical.has(line.stock_item_id)) {
        await stockMove(db, tenantId, doc, line, line.qty, 'release', doc.location_id, `rdoc:${doc.id}:line:${line.id}:release`)
        await stockMove(db, tenantId, doc, line, line.qty, 'sale', doc.location_id, `rdoc:${doc.id}:line:${line.id}:sale`)
      }
      await t(db).from('receivable_lines').update({ qty_delivered: line.qty }).eq('id', line.id)
    }
    await refreshDocumentStatus(db, doc.id)
  }
  await emitInvoiceIfConfigured(db, tenantId, doc, 'on_settlement', doc.total, `rdoc:${doc.id}:inv:settlement`)
}

// ─── Entregas (encargos y crédito) ────────────────────────────────────────────

export async function deliverLines(
  db: Db, tenantId: string, documentId: number,
  items: Array<{ line_id: number; qty: number }>,
  opts: { location_id?: number | null; op_key?: string | null } = {},
): Promise<ReceivableDocument> {
  const doc = await loadDoc(db, documentId)
  if (doc.payment_status === 'void') throw new Error('El documento está anulado.')
  if (doc.modality !== 'special_order' && doc.modality !== 'credit_sale') throw new Error('Esta modalidad no usa entregas manuales.')
  const [lines, bal, party, settings] = await Promise.all([loadLines(db, documentId), getDocumentBalance(db, documentId), getParty(db, doc.party_id), getReceivablesSettings(db, tenantId)])
  const policy = doc.delivery_policy ?? settings.delivery_policy
  const check = canDeliver({ policy, documentBalance: bal.balance, partyBalance: await getPartyBalance(db, doc.party_id), creditLimit: party?.credit_limit })
  if (!check.ok) throw new Error(check.reason)

  const physical = await physicalItems(db, lines.filter((l) => l.stock_item_id).map((l) => l.stock_item_id!))
  const key = opts.op_key ?? `deliver:${documentId}:${Date.now()}`
  for (const it of items) {
    const line = lines.find((l) => l.id === it.line_id)
    if (!line) throw new Error('Línea no encontrada en el documento.')
    const pending = line.qty - line.qty_delivered
    if (!(it.qty > 0) || it.qty > pending) throw new Error(`Puedes entregar hasta ${pending} de "${line.description}".`)
    if (line.kind === 'item' && line.stock_item_id && physical.has(line.stock_item_id)) {
      await stockMove(db, tenantId, doc, line, it.qty, 'sale', opts.location_id ?? doc.location_id, `${key}:line:${line.id}`)
    }
    await t(db).from('receivable_lines').update({ qty_delivered: line.qty_delivered + it.qty }).eq('id', line.id)
  }
  const updated = await refreshDocumentStatus(db, documentId)
  if (updated.delivery_status === 'delivered') await emitInvoiceIfConfigured(db, tenantId, updated, 'on_delivery', updated.total, `rdoc:${documentId}:inv:delivery`)
  return updated
}

/** Encargo → orden de producción del ítem de una línea (E24). Al completarla entra el terminado; la entrega lo descuenta. */
export async function createProductionForLine(db: Db, tenantId: string, documentId: number, lineId: number, locationId?: number | null): Promise<{ productionOrderId: number }> {
  const doc = await loadDoc(db, documentId)
  if (doc.modality !== 'special_order') throw new Error('Solo los encargos generan órdenes de producción.')
  const line = (await loadLines(db, documentId)).find((l) => l.id === lineId)
  if (!line?.stock_item_id) throw new Error('La línea debe ser un producto del inventario.')
  const po = await createProductionOrder(db, {
    tenant_id: tenantId, output_stock_item_id: line.stock_item_id, planned_qty: line.qty - line.qty_delivered,
    location_id: locationId ?? doc.location_id, notes: `Encargo ${doc.number}: ${line.description}`,
  })
  await t(db).from('receivable_documents').update({ production_order_id: po.id, updated_at: new Date().toISOString() }).eq('id', documentId)
  return { productionOrderId: po.id }
}

/**
 * Precio sugerido por ítem de inventario (E27 · consignación/encargos): parte del
 * precio de la variante enlazada al ítem y aplica la lista de precios elegida
 * (p. ej. la del canal del aliado), con la misma resolución que el resto del
 * catálogo (variante > producto, prioridad de la lista).
 */
export async function suggestLinePrices(db: Db, stockItemIds: number[], priceListId?: number | null): Promise<Record<number, number>> {
  if (!stockItemIds.length) return {}
  const { data: variants } = await t(db).from('product_variants').select('id, product_id, price, stock_item_id').in('stock_item_id', stockItemIds)
  const rows = (variants ?? []) as Array<{ id: number; product_id: number; price: number; stock_item_id: number }>
  let items: PriceListItem[] = []
  const priority = new Map<number, number>()
  if (priceListId) {
    const lists = await listPriceLists(db, { activeOnly: true })
    const list = lists.find((l) => l.id === priceListId)
    if (list) {
      priority.set(list.id, list.priority)
      const { data } = await t(db).from('price_list_items').select('*').eq('price_list_id', list.id)
      items = (data ?? []) as PriceListItem[]
    }
  }
  const out: Record<number, number> = {}
  for (const v of rows) {
    if (out[v.stock_item_id] != null) continue
    out[v.stock_item_id] = resolveEffectivePrice(Number(v.price), { productId: v.product_id, variantId: v.id, items, listPriority: priority })
  }
  return out
}

// ─── Consignación ─────────────────────────────────────────────────────────────

/** Registra lo que el aliado vendió (lo reporta el comerciante). No genera cargo: ya se cargó al entregar. */
export async function reportConsignmentSale(db: Db, tenantId: string, documentId: number, lineId: number, qty: number, opKey?: string): Promise<ReceivableDocument> {
  const doc = await loadDoc(db, documentId)
  if (doc.modality !== 'consignment') throw new Error('El documento no es de consignación.')
  const line = (await loadLines(db, documentId)).find((l) => l.id === lineId)
  if (!line) throw new Error('Línea no encontrada.')
  const avail = consignmentAvailable(line)
  if (!(qty > 0) || qty > avail) throw new Error(`El aliado tiene ${avail} unidades de "${line.description}" por reportar o devolver.`)
  if (line.stock_item_id && (await physicalItems(db, [line.stock_item_id])).has(line.stock_item_id)) {
    await stockMove(db, tenantId, doc, line, qty, 'sale', doc.location_id, opKey ?? `consign:${documentId}:line:${lineId}:sold:${Date.now()}`)
  }
  await t(db).from('receivable_lines').update({ qty_sold: line.qty_sold + qty }).eq('id', lineId)
  return refreshDocumentStatus(db, documentId)
}

/** Devuelve mercancía no vendida: transferencia de regreso + nota crédito por su valor. */
export async function returnConsignment(db: Db, tenantId: string, documentId: number, lineId: number, qty: number, toLocationId: number, opKey?: string): Promise<ReceivableDocument> {
  const doc = await loadDoc(db, documentId)
  if (doc.modality !== 'consignment') throw new Error('El documento no es de consignación.')
  if (!doc.location_id) throw new Error('El documento no tiene ubicación del aliado.')
  const line = (await loadLines(db, documentId)).find((l) => l.id === lineId)
  if (!line) throw new Error('Línea no encontrada.')
  const avail = consignmentAvailable(line)
  if (!(qty > 0) || qty > avail) throw new Error(`Solo puedes devolver hasta ${avail} unidades de "${line.description}".`)
  const key = opKey ?? `consign:${documentId}:line:${lineId}:ret:${Date.now()}`
  if (line.stock_item_id && (await physicalItems(db, [line.stock_item_id])).has(line.stock_item_id)) {
    const tr = await createTransfer(db, { tenant_id: tenantId, stock_item_id: line.stock_item_id, from_location_id: doc.location_id, to_location_id: toLocationId, qty, note: `Devolución consignación ${doc.number}` })
    await receiveTransfer(db, tr.id)
  }
  await t(db).from('receivable_lines').update({ qty_returned: line.qty_returned + qty }).eq('id', lineId)
  await appendMovement(db, tenantId, { party_id: doc.party_id, document_id: documentId, line_id: lineId, type: 'credit_note', delta: -Math.round(qty * line.unit_price), note: `Devolución de ${qty} × ${line.description}`, op_key: `${key}:credit` })
  return refreshDocumentStatus(db, documentId)
}

// ─── Anular, castigar, ajustar, caducar ───────────────────────────────────────

export async function voidDocument(db: Db, tenantId: string, documentId: number, opts: { refund: 'store_credit' | 'refund'; note?: string; created_by?: string | null }): Promise<ReceivableDocument> {
  const doc = await loadDoc(db, documentId)
  if (doc.payment_status === 'void') return doc
  const bal = await getDocumentBalance(db, documentId)
  const paid = Math.max(0, bal.credited)
  if (bal.balance > 0) {
    await appendMovement(db, tenantId, { party_id: doc.party_id, document_id: documentId, type: 'credit_note', delta: -bal.balance, note: opts.note ?? 'Anulación', op_key: `rdoc:${documentId}:void`, created_by: opts.created_by })
  }
  if (paid > 0 && opts.refund === 'store_credit') {
    await addStoreCredit({ customerId: doc.party_id, delta: paid, reason: `Anulación ${doc.number}` }, db, tenantId)
  }
  if (doc.modality === 'layaway') await releaseReservation(db, tenantId, doc)
  const { error } = await t(db).from('receivable_documents').update({ payment_status: 'void', notes: [doc.notes, opts.note].filter(Boolean).join(' · ') || null, updated_at: new Date().toISOString() }).eq('id', documentId)
  fail('anular', error)
  return { ...doc, payment_status: 'void' }
}

async function releaseReservation(db: Db, tenantId: string, doc: ReceivableDocument) {
  const lines = await loadLines(db, doc.id)
  const physical = await physicalItems(db, lines.filter((l) => l.stock_item_id).map((l) => l.stock_item_id!))
  for (const line of lines) {
    if (line.kind === 'item' && line.stock_item_id && physical.has(line.stock_item_id) && line.qty_delivered < line.qty) {
      await stockMove(db, tenantId, doc, line, line.qty, 'release', doc.location_id, `rdoc:${doc.id}:line:${line.id}:release`)
    }
  }
}

export async function writeOffDocument(db: Db, tenantId: string, documentId: number, note: string, createdBy?: string | null): Promise<ReceivableDocument> {
  const doc = await loadDoc(db, documentId)
  const bal = await getDocumentBalance(db, documentId)
  if (bal.balance <= 0) throw new Error('El documento no tiene saldo por castigar.')
  await appendMovement(db, tenantId, { party_id: doc.party_id, document_id: documentId, type: 'write_off', delta: -bal.balance, note, op_key: `rdoc:${documentId}:writeoff`, created_by: createdBy })
  const { error } = await t(db).from('receivable_documents').update({ payment_status: 'written_off', updated_at: new Date().toISOString() }).eq('id', documentId)
  fail('castigar', error)
  return { ...doc, payment_status: 'written_off' }
}

export async function adjustDocument(db: Db, tenantId: string, documentId: number, delta: number, note: string, createdBy?: string | null): Promise<ReceivableDocument> {
  if (!note?.trim()) throw new Error('Explica el motivo del ajuste.')
  const doc = await loadDoc(db, documentId)
  await appendMovement(db, tenantId, { party_id: doc.party_id, document_id: documentId, type: 'adjustment', delta, note, created_by: createdBy })
  return refreshDocumentStatus(db, documentId)
}

/** Apartados vencidos sin saldar: libera la reserva y deja el saldo a favor según la política. */
export async function expireLayaways(db: Db, tenantId: string, now = new Date()): Promise<number> {
  const { data } = await t(db).from('receivable_documents').select('id')
    .eq('modality', 'layaway').in('payment_status', ['open', 'partial', 'overdue']).lt('reservation_expires_at', now.toISOString())
  let n = 0
  for (const d of (data ?? []) as Array<{ id: number }>) {
    await voidDocument(db, tenantId, d.id, { refund: 'store_credit', note: 'Apartado vencido' })
    n++
  }
  return n
}

// ─── Lecturas ─────────────────────────────────────────────────────────────────

export interface DocumentListItem extends ReceivableDocument { party_name: string | null; balance: number; charged: number }

export async function listReceivableDocuments(db: Db, opts: { modality?: Modality; status?: ReceivablePaymentStatus | 'open_all'; party_id?: string; limit?: number } = {}): Promise<DocumentListItem[]> {
  let q = t(db).from('receivable_documents').select('*, customers(name)').order('created_at', { ascending: false }).limit(opts.limit ?? 200)
  if (opts.modality) q = q.eq('modality', opts.modality)
  if (opts.party_id) q = q.eq('party_id', opts.party_id)
  if (opts.status === 'open_all') q = q.in('payment_status', ['open', 'partial', 'overdue'])
  else if (opts.status) q = q.eq('payment_status', opts.status)
  const { data, error } = await q
  fail('listar documentos', error)
  const docs = (data ?? []) as Array<ReceivableDocument & { customers?: { name: string | null } | { name: string | null }[] }>
  if (!docs.length) return []
  const { data: bals } = await t(db).from('receivable_document_balances').select('document_id, balance, charged').in('document_id', docs.map((d) => d.id))
  const map = new Map<number, { balance: number; charged: number }>(((bals ?? []) as Array<{ document_id: number; balance: number; charged: number }>).map((b) => [b.document_id, { balance: Number(b.balance), charged: Number(b.charged) }]))
  return docs.map(({ customers, ...d }) => ({
    ...d,
    party_name: (Array.isArray(customers) ? customers[0]?.name : customers?.name) ?? null,
    balance: map.get(d.id)?.balance ?? 0,
    charged: map.get(d.id)?.charged ?? 0,
  }))
}

export async function getReceivableDetail(db: Db, documentId: number, now = new Date()) {
  const doc = await loadDoc(db, documentId)
  const [lines, installments, bal, party, movs] = await Promise.all([
    loadLines(db, documentId), loadInstallments(db, documentId), getDocumentBalance(db, documentId), getParty(db, doc.party_id),
    t(db).from('receivable_movements').select('*').eq('document_id', documentId).order('created_at'),
  ])
  const financed = installments.reduce((s, i) => s + i.amount, 0)
  const paidTowardsInstallments = Math.max(0, bal.charged - bal.balance) - (bal.charged - financed)
  return {
    doc, lines, party, balance: bal,
    movements: (movs.data ?? []) as ReceivableMovement[],
    installments: installmentProgress(installments, Math.max(0, paidTowardsInstallments), today(now)),
  }
}

/** Estado de cuenta de una contraparte: documentos, movimientos y saldo. */
export async function getStatement(db: Db, partyId: string) {
  const [party, docs, movs, balance] = await Promise.all([
    getParty(db, partyId),
    listReceivableDocuments(db, { party_id: partyId, limit: 500 }),
    t(db).from('receivable_movements').select('*').eq('party_id', partyId).order('created_at'),
    getPartyBalance(db, partyId),
  ])
  let running = 0
  const movements = ((movs.data ?? []) as ReceivableMovement[]).map((m) => ({ ...m, running: (running += m.delta) }))
  return { party, documents: docs, movements, balance }
}

/** Cartera por edades del tenant (documentos abiertos). */
export async function getAgingReport(db: Db, now = new Date()) {
  const docs = await listReceivableDocuments(db, { status: 'open_all', limit: 5000 })
  return { ...agingReport(docs.map((d) => ({ balance: d.balance, due_date: d.due_date })), today(now)), documents: docs }
}

/** Recaudo por período (abonos) y anticipos recibidos sin entregar (encargos). */
export async function getCollectionsReport(db: Db, from: string, to: string) {
  const { data } = await t(db).from('receivable_movements').select('delta, method, created_at').eq('type', 'payment').gte('created_at', from).lt('created_at', to)
  const rows = (data ?? []) as Array<{ delta: number; method: string | null }>
  const byMethod: Record<string, number> = {}
  for (const r of rows) byMethod[r.method ?? 'other'] = (byMethod[r.method ?? 'other'] ?? 0) - r.delta
  const total = Object.values(byMethod).reduce((s, v) => s + v, 0)
  const orders = await listReceivableDocuments(db, { modality: 'special_order', limit: 5000 })
  const advancesPending = orders.filter((d) => d.payment_status !== 'void' && d.delivery_status !== 'delivered')
    .reduce((s, d) => s + Math.max(0, d.charged - d.balance), 0)
  return { total, byMethod, advancesPending }
}

/** Documentos que requieren recordatorio (antes o después del vencimiento). */
export async function listDueForReminder(db: Db, settings: ReceivablesSettings, now = new Date()) {
  const docs = await listReceivableDocuments(db, { status: 'open_all', limit: 5000 })
  const d0 = today(now)
  const inDays = (n: number) => new Date(now.getTime() + n * 86_400_000).toISOString().slice(0, 10)
  return docs.filter((d) => d.balance > 0 && d.due_date).map((d) => {
    const kind = d.due_date === inDays(settings.reminder_days_before) ? 'before'
      : d.due_date === inDays(-settings.reminder_days_after) ? 'after' : null
    return kind ? { doc: d, kind } : null
  }).filter((x): x is { doc: DocumentListItem; kind: 'before' | 'after' } => !!x && !(x.doc as unknown as { last_reminder_at?: string }).last_reminder_at?.startsWith(d0))
}

export async function markReminderSent(db: Db, documentId: number, kind: string): Promise<void> {
  await t(db).from('receivable_documents').update({ last_reminder_kind: kind, last_reminder_at: new Date().toISOString() }).eq('id', documentId)
}

export async function listInvoiceEvents(db: Db, opts: { status?: string; limit?: number } = {}) {
  let q = t(db).from('receivable_invoice_events').select('*, receivable_documents(number)').order('created_at', { ascending: false }).limit(opts.limit ?? 200)
  if (opts.status) q = q.eq('status', opts.status)
  const { data, error } = await q
  fail('eventos de facturación', error)
  return (data ?? []) as Array<{ id: number; document_id: number; event: string; amount: number; status: string; created_at: string; receivable_documents?: { number: string } }>
}

/** CSV de cartera para el contador (documentos con saldo). */
export function receivablesToCsv(docs: DocumentListItem[]): string {
  const esc = (v: unknown) => { const s = String(v ?? ''); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
  const head = ['numero', 'contraparte', 'modalidad', 'estado_pago', 'estado_entrega', 'total', 'cargado', 'saldo', 'vence', 'creado']
  return [head.join(','), ...docs.map((d) => [d.number, d.party_name, d.modality, d.payment_status, d.delivery_status, d.total, d.charged, d.balance, d.due_date ?? '', d.created_at.slice(0, 10)].map(esc).join(','))].join('\n')
}
