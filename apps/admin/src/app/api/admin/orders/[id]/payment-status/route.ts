/**
 * PATCH /api/admin/orders/[id]/payment-status
 *
 * Validación manual del pago por el administrador (HU-096). Para pedidos sin
 * pasarela en línea (`payment_method = 'manual'`) o como respaldo del operador.
 *
 * Seguridad: guard admin (super_admin/admin/vendedor); solo acepta 'approved' o
 * 'rejected'; nunca accesible desde el sitio público.
 */
import { createServerClient, applyStockForOrder, restoreStockForOrder } from '@merkiai/database'
import type { Database } from '@merkiai/database'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { sendPaymentConfirmed } from '@/lib/email'

type OrderUpdate = Database['public']['Tables']['orders']['Update']

async function requireVendedor() {
  const user = await getAdminUser()
  if (!user) return { user: null, error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  const allowed = ['super_admin', 'admin', 'vendedor']
  if (!allowed.includes(user.role)) {
    return { user: null, error: NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 }) }
  }
  return { user, error: null }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error: authError } = await requireVendedor()
  if (authError) return authError

  const { id } = await params
  const orderId = Number(id)
  if (!Number.isFinite(orderId)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))
  const payment_status = body.payment_status
  if (payment_status !== 'approved' && payment_status !== 'rejected') {
    return NextResponse.json({ error: 'payment_status debe ser "approved" o "rejected"' }, { status: 400 })
  }

  const supabase = createServerClient()

  // Al aprobar, el pedido avanza a preparación (processing). Rechazar no avanza.
  const updatePayload: OrderUpdate = {
    payment_status,
    updated_at: new Date().toISOString(),
    ...(payment_status === 'approved' ? { status: 'processing' as const } : {}),
  }

  const { data: order, error } = await supabase
    .from('orders')
    .update(updatePayload)
    .eq('id', orderId)
    .select()
    .single()

  if (error || !order) {
    return NextResponse.json({ error: 'No se pudo actualizar el pedido' }, { status: 500 })
  }

  // Inventario (idempotente): aprobar descuenta stock; rechazar lo repone si estaba descontado
  if (payment_status === 'approved') {
    await applyStockForOrder(order.order_number).catch((e) => console.error('[payment-status] stock:', e))
  } else {
    await restoreStockForOrder(order.order_number).catch((e) => console.error('[payment-status] stock:', e))
  }

  // Email de confirmación al cliente — fire-and-forget, no bloquea la respuesta
  if (payment_status === 'approved') {
    void (async () => {
      try {
        const { data: cfg } = await supabase
          .from('store_config')
          .select('resend_api_key, resend_from_email, store_name')
          .single()
        if (!cfg?.resend_api_key || !cfg?.resend_from_email) return
        await sendPaymentConfirmed(
          {
            order_number:   order.order_number,
            customer_email: order.customer_email,
            customer_name:  order.customer_name,
          },
          { apiKey: cfg.resend_api_key, fromEmail: cfg.resend_from_email, storeName: cfg.store_name ?? undefined },
        )
      } catch (emailErr) {
        console.error('[payment-status] email error:', emailErr)
      }
    })()
  }

  return NextResponse.json({ payment_status: order.payment_status, status: order.status })
}
