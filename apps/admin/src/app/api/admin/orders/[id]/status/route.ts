import { NextRequest, NextResponse } from 'next/server'
import { restoreStockForOrder, resolveEmailConfig, logAudit, recordEmail } from '@merkiai/database'
import { sendShippingNotification, sendStatusNotification } from '@/lib/email'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'

const NOTIFIABLE_STATUSES = new Set(['shipped', 'delivered', 'cancelled'])

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const adminUser = await getAdminUser()
    if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const { status } = await req.json()
    const supabase = getAdminDb(adminUser.tenantId)

    const { data: order, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', Number(id))
      .select()
      .single()

    if (error) throw error

    // HU-146 · auditoría del cambio de estado.
    await logAudit(supabase, {
      tenantId: adminUser.tenantId, actorEmail: adminUser.email, actorRole: adminUser.role,
      action: 'order.status', entity: 'order', entityId: order?.order_number ?? id,
      summary: `Estado del pedido ${order?.order_number ?? id} → ${status}`, metadata: { status },
    })

    // Inventario: al cancelar un pedido se repone el stock descontado (idempotente)
    if (status === 'cancelled' && order) {
      await restoreStockForOrder(order.order_number).catch((e) => console.error('[status] stock restore:', e))
    }

    // ── Email al cliente ────────────────────────────────────────────────────
    // Se AWAITea el envío: en Vercel serverless el trabajo "fire-and-forget"
    // después de responder NO está garantizado (la función se congela al devolver
    // la respuesta y el fetch a Resend puede no completarse → correos intermitentes).
    // Awaitear agrega ~1 s pero garantiza el envío; nunca tumba el cambio de estado.
    if (NOTIFIABLE_STATUSES.has(status) && order) {
      const ec = await resolveEmailConfig(supabase, adminUser.tenantId).catch(() => null)
      if (ec) {
        const emailConfig = { apiKey: ec.apiKey, fromEmail: ec.fromEmail, storeName: ec.storeName }
        try {
          if (status === 'shipped') {
            await sendShippingNotification(
              {
                order_number:    order.order_number,
                customer_email:  order.customer_email,
                customer_name:   order.customer_name,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                tracking_number: (order as any).tracking_number ?? null,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                carrier_name:    (order as any).carrier_name    ?? null,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                label_url:       (order as any).label_url       ?? null,
              },
              emailConfig,
            )
          } else if (status === 'delivered' || status === 'cancelled') {
            await sendStatusNotification(
              { order_number: order.order_number, customer_email: order.customer_email, customer_name: order.customer_name },
              status,
              emailConfig,
            )
          }
          // HU-162 · registro de email enviado.
          await recordEmail(supabase, { tenantId: adminUser.tenantId, to: order.customer_email, type: 'order.status', provider: ec.provider, status: 'sent', entity: order.order_number })
        } catch (emailErr) {
          // HU-162 · reemplaza el `.catch` mudo: registra el fallo con trazabilidad.
          console.error('[status/route] email error:', emailErr instanceof Error ? emailErr.message : emailErr)
          await recordEmail(supabase, { tenantId: adminUser.tenantId, to: order.customer_email, type: 'order.status', provider: ec.provider, status: 'failed', entity: order.order_number, error: emailErr instanceof Error ? emailErr.message : String(emailErr) })
        }
      }
    }

    return NextResponse.json(order)
  } catch (err) {
    return NextResponse.json({ error: 'Error actualizando estado' }, { status: 500 })
  }
}
