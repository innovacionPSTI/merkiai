/**
 * POST /api/receivables/pay — E27 · HU-455
 * Verifica el enlace firmado, calcula el saldo del documento y crea el pago con
 * la pasarela activa de la tienda (misma resolución que el checkout, incl.
 * Merkiai Pagos). La referencia `CXC-<doc>-<ts>` hace que el webhook registre
 * el abono en cartera en vez de buscar un pedido.
 */
import { NextRequest, NextResponse } from 'next/server'
import { verifyReceivableLink, receivablePaymentReference, resolveActivePayment, gatewayFromInstance } from '@merkiai/database'
import { resolveTenant } from '@/lib/tenant-context'
import { getMachineDb } from '@/lib/machine-db'
import { baseUrlFromRequest } from '@/lib/base-url'
import { hydrateManagedPayment, gatewayMethod } from '@/lib/merkiai-pagos'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null)
  const documentId = Number(form?.get('d'))
  const sig = String(form?.get('s') ?? '')
  const site = baseUrlFromRequest(req)
  const back = (error?: string) => NextResponse.redirect(`${site}/pagar-saldo?d=${documentId}&s=${encodeURIComponent(sig)}${error ? `&error=${encodeURIComponent(error)}` : ''}`, 303)

  const { tenantId } = await resolveTenant()
  if (!verifyReceivableLink(tenantId, documentId, sig, process.env.INTERNAL_API_SECRET)) {
    return NextResponse.json({ error: 'Enlace no válido' }, { status: 403 })
  }
  const db = getMachineDb(tenantId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyDb = db as any
  const [{ data: doc }, { data: bal }] = await Promise.all([
    anyDb.from('receivable_documents').select('id, number, payment_status, customers(name, email, phone)').eq('id', documentId).eq('tenant_id', tenantId).maybeSingle(),
    anyDb.from('receivable_document_balances').select('balance').eq('document_id', documentId).maybeSingle(),
  ])
  const balance = Number(bal?.balance ?? 0)
  if (!doc || doc.payment_status === 'void' || balance <= 0) return back()

  let active
  try {
    active = await hydrateManagedPayment(await resolveActivePayment(db, tenantId), tenantId)
  } catch {
    return back('La pasarela de pago no está disponible en este momento.')
  }
  if (!active || active.provider === 'tucompra') return back('Esta tienda no tiene habilitado el pago en línea del saldo. Comunícate con ella.')

  try {
    const gateway = gatewayFromInstance(active.provider, active.credentials, active.settings)
    const c = Array.isArray(doc.customers) ? doc.customers[0] : doc.customers
    const reference = receivablePaymentReference(documentId)
    const url = await gateway.createPaymentUrl({
      orderNumber: reference,
      amountInCents: balance * 100,
      currency: 'COP',
      customerEmail: c?.email ?? 'sin-correo@merkiai.com',
      customerName: c?.name ?? 'Cliente',
      customerPhone: c?.phone ?? undefined,
      items: [{ id: String(documentId), title: `Saldo ${doc.number}`, quantity: 1, unit_price: balance }],
      redirectUrl: `${site}/pagar-saldo?d=${documentId}&s=${encodeURIComponent(sig)}&estado=procesando`,
      webhookUrl: `${site}/api/webhooks/${gatewayMethod(active.provider)}`,
    })
    return NextResponse.redirect(url, 303)
  } catch (e) {
    console.error('[receivables/pay]', e instanceof Error ? e.message : e)
    return back('No se pudo iniciar el pago. Intenta de nuevo en unos minutos.')
  }
}
