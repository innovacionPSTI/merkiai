'use server'

/**
 * Acciones de Cartera (E27 · ADR-010). Todas exigen la feature `receivables`
 * (y `consignment` para consignación) y operan con el cliente RLS del tenant.
 * Devuelven `{ ok, error? }` con mensajes listos para el comerciante.
 */
import { revalidatePath } from 'next/cache'
import {
  createReceivableDocument, registerPayment, deliverLines, reportConsignmentSale, returnConsignment,
  voidDocument, writeOffDocument, adjustDocument, createProductionForLine, createParty, savePartyCredit, saveReceivablesSettings, createLocation,
  isModality, type CreateDocumentInput, type ReceivablePaymentMethod, type ReceivablesSettings,
} from '@merkiai/database'
import { requireCartera } from '@/lib/cartera'

export type ActionResult = { ok: true; id?: number | string; message?: string } | { ok: false; error: string }

async function run(fn: (ctx: Awaited<ReturnType<typeof requireCartera>>) => Promise<ActionResult>, paths: string[] = ['/cartera']): Promise<ActionResult> {
  try {
    const ctx = await requireCartera()
    const r = await fn(ctx)
    for (const p of paths) revalidatePath(p)
    return r
  } catch (e) {
    // redirect()/notFound() de Next se relanzan; el resto vuelve como mensaje.
    if (e && typeof e === 'object' && 'digest' in e) throw e
    return { ok: false, error: e instanceof Error ? e.message : 'No se pudo completar la operación.' }
  }
}

export async function createDocumentAction(input: CreateDocumentInput): Promise<ActionResult> {
  return run(async ({ db, tenantId, adminUser, consignmentEnabled }) => {
    if (!isModality(input.modality)) return { ok: false, error: 'Modalidad inválida.' }
    if (input.modality === 'consignment' && !consignmentEnabled) return { ok: false, error: 'La consignación no está habilitada en tu plan.' }
    const doc = await createReceivableDocument(db, tenantId, { ...input, created_by: adminUser.displayName ?? null })
    return { ok: true, id: doc.id, message: `Documento ${doc.number} creado.` }
  })
}

export async function registerPaymentAction(input: { party_id: string; amount: number; method: ReceivablePaymentMethod; reference?: string; note?: string; document_id?: number | null; line_id?: number | null; op_key: string }): Promise<ActionResult> {
  return run(async ({ db, tenantId, adminUser }) => {
    if (!(input.amount > 0)) return { ok: false, error: 'El abono debe ser mayor a cero.' }
    const r = await registerPayment(db, tenantId, { ...input, created_by: adminUser.displayName ?? null })
    if (r.deduped) return { ok: true, message: 'Este abono ya estaba registrado.' }
    return { ok: true, message: r.surplus > 0 ? `Abono registrado. Quedó un saldo a favor de ${r.surplus} como crédito en tienda.` : 'Abono registrado.' }
  }, ['/cartera', '/cartera/contrapartes'])
}

export async function deliverAction(documentId: number, items: Array<{ line_id: number; qty: number }>, locationId?: number | null): Promise<ActionResult> {
  return run(async ({ db, tenantId }) => {
    await deliverLines(db, tenantId, documentId, items, { location_id: locationId ?? null })
    return { ok: true, message: 'Entrega registrada.' }
  })
}

export async function productionAction(documentId: number, lineId: number): Promise<ActionResult> {
  return run(async ({ db, tenantId }) => {
    const r = await createProductionForLine(db, tenantId, documentId, lineId)
    return { ok: true, id: r.productionOrderId, message: 'Orden de producción creada (la ves en Producción).' }
  }, ['/cartera', '/produccion'])
}

export async function reportSaleAction(documentId: number, lineId: number, qty: number): Promise<ActionResult> {
  return run(async ({ db, tenantId }) => {
    await reportConsignmentSale(db, tenantId, documentId, lineId, qty)
    return { ok: true, message: 'Venta del aliado registrada.' }
  })
}

export async function returnConsignmentAction(documentId: number, lineId: number, qty: number, toLocationId: number): Promise<ActionResult> {
  return run(async ({ db, tenantId }) => {
    await returnConsignment(db, tenantId, documentId, lineId, qty, toLocationId)
    return { ok: true, message: 'Devolución registrada y descontada del saldo.' }
  })
}

export async function voidAction(documentId: number, refund: 'store_credit' | 'refund', note: string): Promise<ActionResult> {
  return run(async ({ db, tenantId, adminUser }) => {
    await voidDocument(db, tenantId, documentId, { refund, note: note || 'Anulado', created_by: adminUser.displayName ?? null })
    return { ok: true, message: 'Documento anulado.' }
  })
}

export async function writeOffAction(documentId: number, note: string): Promise<ActionResult> {
  return run(async ({ db, tenantId, adminUser }) => {
    if (!note.trim()) return { ok: false, error: 'Explica por qué se castiga la deuda.' }
    await writeOffDocument(db, tenantId, documentId, note, adminUser.displayName ?? null)
    return { ok: true, message: 'Saldo castigado.' }
  })
}

export async function adjustAction(documentId: number, delta: number, note: string): Promise<ActionResult> {
  return run(async ({ db, tenantId, adminUser }) => {
    if (!delta) return { ok: false, error: 'El ajuste no puede ser cero.' }
    await adjustDocument(db, tenantId, documentId, Math.round(delta), note, adminUser.displayName ?? null)
    return { ok: true, message: 'Ajuste registrado.' }
  })
}

export async function createPartyAction(input: { name: string; email?: string; phone?: string; party_role: 'customer' | 'consignee'; credit_limit?: number | null; default_terms_days?: number | null; document_id?: string }): Promise<ActionResult> {
  return run(async ({ db, tenantId }) => {
    const p = await createParty(db, tenantId, input)
    return { ok: true, id: p.id, message: `${p.name} creado.` }
  }, ['/cartera/contrapartes', '/cartera/nuevo'])
}

export async function updatePartyAction(id: string, patch: { credit_limit?: number | null; default_terms_days?: number | null; party_role?: 'customer' | 'consignee' }): Promise<ActionResult> {
  return run(async ({ db }) => {
    await savePartyCredit(db, id, patch)
    return { ok: true, message: 'Condiciones actualizadas.' }
  }, ['/cartera/contrapartes'])
}

/** Crea la ubicación de consignación del aliado (stock que tiene en su poder). */
export async function createConsigneeLocationAction(partyId: string, name: string): Promise<ActionResult> {
  return run(async ({ db, tenantId, consignmentEnabled }) => {
    if (!consignmentEnabled) return { ok: false, error: 'La consignación no está habilitada en tu plan.' }
    const loc = await createLocation(db, { tenant_id: tenantId, code: `CONS-${partyId.slice(0, 8)}`, name: name.trim() || 'Aliado', kind: 'consignment' })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any).from('locations').update({ party_id: partyId }).eq('id', loc.id)
    return { ok: true, id: loc.id, message: 'Ubicación del aliado creada.' }
  }, ['/cartera/contrapartes', '/cartera/nuevo'])
}

export async function saveSettingsAction(s: Partial<ReceivablesSettings>): Promise<ActionResult> {
  return run(async ({ db, tenantId }) => {
    await saveReceivablesSettings(db, tenantId, s)
    return { ok: true, message: 'Ajustes guardados.' }
  }, ['/cartera/ajustes'])
}
