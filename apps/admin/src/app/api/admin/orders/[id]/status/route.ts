import { NextRequest, NextResponse } from 'next/server'
import { restoreStockForOrder, resolveEmailConfig, logAudit, recordEmail, sendTemplatedEmail } from '@merkiai/database'
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
        const emailConfig = { apiKey: ec.apiKey, fromEmail: ec.fromEmail, storeName: ec.storeName, emailProvider: ec.provider }
        // HU-160 · usa la plantilla editable del tenant por estado (respeta el
        // toggle de activación). HU-162 · registra el resultado en email_log.
        const type = `order.${status}` // order.shipped | order.delivered | order.cancelled | ...
        try {
          const r = await sendTemplatedEmail(supabase, {
            tenantId: adminUser.tenantId,
            type,
            to: order.customer_email,
            vars: {
              customer_name: order.customer_name,
              order_number: order.order_number,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              tracking_url: (order as any).label_url ?? '',
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              carrier_name: (order as any).carrier_name ?? '',
              status,
            },
          }, emailConfig)
          await recordEmail(supabase, { tenantId: adminUser.tenantId, to: order.customer_email, type, provider: ec.provider, status: r.status === 'sent' ? 'sent' : 'suppressed', entity: order.order_number })
        } catch (emailErr) {
          // HU-162 · reemplaza el `.catch` mudo: registra el fallo con trazabilidad.
          console.error('[status/route] email error:', emailErr instanceof Error ? emailErr.message : emailErr)
          await recordEmail(supabase, { tenantId: adminUser.tenantId, to: order.customer_email, type, provider: ec.provider, status: 'failed', entity: order.order_number, error: emailErr instanceof Error ? emailErr.message : String(emailErr) })
        }
      }
    }

    return NextResponse.json(order)
  } catch (err) {
    return NextResponse.json({ error: 'Error actualizando estado' }, { status: 500 })
  }
}
