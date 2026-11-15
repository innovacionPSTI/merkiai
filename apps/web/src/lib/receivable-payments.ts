/**
 * Abonos de cartera pagados con la pasarela de la tienda (E27 · HU-455).
 * Los webhooks de pago llaman a `handleReceivableWebhook` cuando la referencia
 * es `CXC-…` (no es un pedido): registra el abono en el libro de cartera,
 * idempotente por transacción, con el cliente RLS del tenant.
 */
import { NextResponse } from 'next/server'
import { registerPayment } from '@merkiai/database'
import { getMachineDb } from './machine-db'

// Mismo formato que `receivablePaymentReference` (@merkiai/database): CXC-<doc>-<ts>.
function parseReceivableReference(ref: string | null | undefined): { documentId: number } | null {
  const m = ref?.match(/^CXC-(\d+)-\d+$/)
  return m ? { documentId: Number(m[1]) } : null
}

export const isReceivableReference = (ref: string | null | undefined) => !!parseReceivableReference(ref)

export async function handleReceivableWebhook(input: {
  tenantId: string
  provider: string
  reference: string
  approved: boolean
  paymentId?: string | null
  amountCop?: number | null
}): Promise<NextResponse> {
  const parsed = parseReceivableReference(input.reference)
  if (!parsed) return NextResponse.json({ ok: true, ignored: true })
  if (!input.approved) return NextResponse.json({ ok: true, receivable: 'not_approved' })
  if (!(input.amountCop && input.amountCop > 0)) {
    console.warn(`[webhook/${input.provider}] abono de cartera ${input.reference} sin monto; se ignora`)
    return NextResponse.json({ ok: true, receivable: 'no_amount' })
  }
  const db = getMachineDb(input.tenantId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: doc } = await (db as any).from('receivable_documents').select('id, party_id').eq('id', parsed.documentId).eq('tenant_id', input.tenantId).maybeSingle()
  if (!doc) {
    console.warn(`[webhook/${input.provider}] documento de cartera ${parsed.documentId} no encontrado`)
    return NextResponse.json({ ok: true, receivable: 'not_found' })
  }
  try {
    const r = await registerPayment(db, input.tenantId, {
      party_id: doc.party_id, document_id: doc.id, amount: Math.round(input.amountCop), method: 'link',
      reference: input.paymentId ?? input.reference, note: 'Pago en línea',
      op_key: `link:${input.provider}:${input.paymentId ?? input.reference}`,
    })
    return NextResponse.json({ ok: true, receivable: r.deduped ? 'duplicate' : 'applied' })
  } catch (e) {
    console.error(`[webhook/${input.provider}] no se registró el abono de cartera`, e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'receivable_failed' }, { status: 500 }) // la pasarela reintenta
  }
}
