'use server'

/**
 * Acciones de Cartera (E27 · ADR-010). Todas exigen la feature `receivables`
 * (y `consignment` para consignación) y operan con el cliente RLS del tenant.
 * Devuelven `{ ok, error? }` con mensajes listos para el comerciante.
 */
import { revalidatePath } from 'next/cache'
import {
  createReceivableDocument, registerPayment, deliverLines, reportConsignmentSale, returnConsignment,
  voidDocument, writeOffDocument, adjustDocument, createProductionForLine, suggestLinePrices,
  getStatement, resolveEmailConfig, sendRawEmail, MODALITY_LABEL, signReceivableLink, logAudit, createParty, savePartyCredit, saveReceivablesSettings, createLocation,
  isModality, type CreateDocumentInput, type ReceivablePaymentMethod, type ReceivablesSettings,
} from '@merkiai/database'
import { requireCartera } from '@/lib/cartera'
import { resolveStoreBaseUrl } from '@/lib/store-url'

export type ActionResult = { ok: true; id?: number | string; message?: string } | { ok: false; error: string }

type AuditSpec = { action: string; entity: string; entityId?: string | number | null; summary?: string; metadata?: Record<string, unknown> }

async function run(fn: (ctx: Awaited<ReturnType<typeof requireCartera>>) => Promise<ActionResult>, paths: string[] = ['/cartera'], audit?: AuditSpec): Promise<ActionResult> {
  try {
    const ctx = await requireCartera()
    const r = await fn(ctx)
    for (const p of paths) revalidatePath(p)
    // Trazabilidad (SOC 2 CC7 / ISO 27001 A.8.15): operaciones de dinero quedan en la auditoría.
    if (audit && r.ok) {
      await logAudit(ctx.db, {
        tenantId: ctx.tenantId, actorEmail: ctx.adminUser.email, actorRole: ctx.adminUser.role,
        action: audit.action, entity: audit.entity, entityId: audit.entityId ?? r.id ?? null,
        summary: audit.summary ?? r.message ?? null, metadata: audit.metadata,
      })
    }
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
  }, ['/cartera'], { action: 'receivable.create', entity: 'receivable_document', metadata: { modality: input.modality, party_id: input.party_id } })
}

export async function registerPaymentAction(input: { party_id: string; amount: number; method: ReceivablePaymentMethod; reference?: string; note?: string; document_id?: number | null; line_id?: number | null; op_key: string }): Promise<ActionResult> {
  return run(async ({ db, tenantId, adminUser }) => {
    if (!(input.amount > 0)) return { ok: false, error: 'El abono debe ser mayor a cero.' }
    const r = await registerPayment(db, tenantId, { ...input, created_by: adminUser.displayName ?? null })
    if (r.deduped) return { ok: true, message: 'Este abono ya estaba registrado.' }
    return { ok: true, message: r.surplus > 0 ? `Abono registrado. Quedó un saldo a favor de ${r.surplus} como crédito en tienda.` : 'Abono registrado.' }
  }, ['/cartera', '/cartera/contrapartes'], { action: 'receivable.payment', entity: 'receivable_document', entityId: input.document_id ?? null, metadata: { party_id: input.party_id, amount: input.amount, method: input.method } })
}

export async function deliverAction(documentId: number, items: Array<{ line_id: number; qty: number }>, locationId?: number | null): Promise<ActionResult> {
  return run(async ({ db, tenantId }) => {
    await deliverLines(db, tenantId, documentId, items, { location_id: locationId ?? null })
    return { ok: true, message: 'Entrega registrada.' }
  })
}

/** Precios sugeridos por ítem (variante enlazada + lista de precios del canal, si se elige). */
export async function suggestPricesAction(stockItemIds: number[], priceListId: number | null): Promise<Record<number, number>> {
  const { db } = await requireCartera()
  return suggestLinePrices(db, stockItemIds.filter((n) => Number.isFinite(n)), priceListId).catch(() => ({}))
}

/** Envía el estado de cuenta por correo a la contraparte (proveedor de correo de la tienda). */
export async function sendStatementAction(partyId: string): Promise<ActionResult> {
  return run(async ({ db, tenantId }) => {
    const st = await getStatement(db, partyId)
    if (!st.party?.email) return { ok: false, error: 'Esta contraparte no tiene correo registrado.' }
    const ec = await resolveEmailConfig(db, tenantId).catch(() => null)
    if (!ec) return { ok: false, error: 'Configura el correo de tu tienda (Configuración → Emails) para enviar estados de cuenta.' }
    const money = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
    const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)
    const open = st.documents.filter((d) => d.balance > 0)
    const rows = open.map((d) => `<tr><td style="padding:4px 8px">${esc(d.number)}</td><td style="padding:4px 8px">${esc(MODALITY_LABEL[d.modality])}</td><td style="padding:4px 8px">${d.due_date ?? '—'}</td><td style="padding:4px 8px;text-align:right">${money(d.balance)}</td></tr>`).join('')
    const html = `<div style="font-family:system-ui,sans-serif;max-width:600px;margin:auto;color:#1f2937">
      <h2 style="margin:0 0 8px">Estado de cuenta</h2>
      <p>Hola, <strong>${esc(st.party.name ?? '')}</strong>. Este es tu estado de cuenta al ${new Date().toISOString().slice(0, 10)}.</p>
      ${open.length ? `<table style="border-collapse:collapse;width:100%;font-size:14px"><thead><tr style="text-align:left;color:#6b7280"><th style="padding:4px 8px">Documento</th><th style="padding:4px 8px">Tipo</th><th style="padding:4px 8px">Vence</th><th style="padding:4px 8px;text-align:right">Saldo</th></tr></thead><tbody>${rows}</tbody></table>` : '<p>No tienes saldos pendientes.</p>'}
      <p style="font-size:16px">Saldo total: <strong>${money(st.balance)}</strong></p>
      <p style="color:#6b7280;font-size:13px">Si tienes dudas, responde este correo.</p></div>`
    await sendRawEmail({ apiKey: ec.apiKey, fromEmail: ec.fromEmail, storeName: ec.storeName, emailProvider: ec.provider }, { to: st.party.email, subject: `Estado de cuenta · saldo ${money(st.balance)}`, html })
    return { ok: true, message: `Estado de cuenta enviado a ${st.party.email}.` }
  }, [])
}

/** Enlace público firmado para que el cliente pague el saldo con la pasarela de la tienda (HU-455). */
export async function paymentLinkAction(documentId: number): Promise<ActionResult> {
  return run(async ({ tenantId }) => {
    const secret = process.env.INTERNAL_API_SECRET
    if (!secret) return { ok: false, error: 'El entorno no tiene configurado el secreto interno.' }
    const base = await resolveStoreBaseUrl(tenantId)
    if (!base) return { ok: false, error: 'No se pudo resolver la dirección de tu tienda.' }
    const url = `${base}/pagar-saldo?d=${documentId}&s=${encodeURIComponent(signReceivableLink(tenantId, documentId, secret))}`
    return { ok: true, message: url }
  }, [])
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
  }, ['/cartera'], { action: 'receivable.consignment_return', entity: 'receivable_document', entityId: documentId, metadata: { lineId, qty } })
}

export async function voidAction(documentId: number, refund: 'store_credit' | 'refund', note: string): Promise<ActionResult> {
  return run(async ({ db, tenantId, adminUser }) => {
    await voidDocument(db, tenantId, documentId, { refund, note: note || 'Anulado', created_by: adminUser.displayName ?? null })
    return { ok: true, message: 'Documento anulado.' }
  }, ['/cartera'], { action: 'receivable.void', entity: 'receivable_document', entityId: documentId, metadata: { refund, note } })
}

export async function writeOffAction(documentId: number, note: string): Promise<ActionResult> {
  return run(async ({ db, tenantId, adminUser }) => {
    if (!note.trim()) return { ok: false, error: 'Explica por qué se castiga la deuda.' }
    await writeOffDocument(db, tenantId, documentId, note, adminUser.displayName ?? null)
    return { ok: true, message: 'Saldo castigado.' }
  }, ['/cartera'], { action: 'receivable.write_off', entity: 'receivable_document', entityId: documentId, metadata: { note } })
}

export async function adjustAction(documentId: number, delta: number, note: string): Promise<ActionResult> {
  return run(async ({ db, tenantId, adminUser }) => {
    if (!delta) return { ok: false, error: 'El ajuste no puede ser cero.' }
    await adjustDocument(db, tenantId, documentId, Math.round(delta), note, adminUser.displayName ?? null)
    return { ok: true, message: 'Ajuste registrado.' }
  }, ['/cartera'], { action: 'receivable.adjust', entity: 'receivable_document', entityId: documentId, metadata: { delta, note } })
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
  }, ['/cartera/contrapartes'], { action: 'receivable.party_terms', entity: 'customer', entityId: id, metadata: patch })
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
  }, ['/cartera/ajustes'], { action: 'receivable.settings', entity: 'receivables_settings', metadata: s as Record<string, unknown> })
}
