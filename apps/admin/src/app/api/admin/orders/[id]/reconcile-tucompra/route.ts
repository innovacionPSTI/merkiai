/**
 * POST /api/admin/orders/[id]/reconcile-tucompra
 *
 * Acción manual del operador para reconciliar un pago Tu Compra pendiente. Tu Compra
 * NO tiene webhook: se consulta el estado real a su API REST vía el núcleo compartido
 * `reconcileTuCompraOrder` de @merkiai/database (sin saltos HTTP entre apps).
 */
import { reconcileTuCompraOrder } from '@merkiai/database'
import { getAdminDb } from '@/lib/admin-db'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { sendPaymentConfirmed } from '@/lib/email'

async function requireVendedor() {
  const user = await getAdminUser()
  if (!user) return { user: null, error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  const allowed = ['super_admin', 'admin', 'vendedor']
  if (!allowed.includes(user.role)) {
    return { user: null, error: NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 }) }
  }
  return { user, error: null }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error: authError } = await requireVendedor()
  if (authError) return authError

  const { id } = await params
  const orderId = Number(id)
  if (!Number.isFinite(orderId)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  const supabase = getAdminDb(user!.tenantId)
  const { data: order } = await supabase
    .from('orders')
    .select('order_number, payment_method, customer_email, customer_name')
    .eq('id', orderId)
    .single()

  if (!order) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
  if (order.payment_method !== 'tucompra') {
    return NextResponse.json({ error: 'Este pedido no es un pago Tu Compra' }, { status: 400 })
  }

  try {
    const result = await reconcileTuCompraOrder(order.order_number)

    if (result.status === 'approved') {
      void (async () => {
        try {
          const { data: cfg } = await supabase
            .from('store_config')
            .select('resend_api_key, resend_from_email, store_name')
            .single()
          if (cfg?.resend_api_key && cfg?.resend_from_email) {
            await sendPaymentConfirmed(
              { order_number: order.order_number, customer_email: order.customer_email, customer_name: order.customer_name },
              { apiKey: cfg.resend_api_key, fromEmail: cfg.resend_from_email, storeName: cfg.store_name ?? undefined },
            )
          }
        } catch (e) {
          console.error('[reconcile-tucompra] email:', e)
        }
      })()
    }

    return NextResponse.json({ status: result.status ?? 'pending', reason: result.reason })
  } catch (err) {
    console.error('[admin/reconcile-tucompra]', err)
    return NextResponse.json({ error: 'No se pudo consultar a Tu Compra' }, { status: 502 })
  }
}
