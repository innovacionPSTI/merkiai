import { NextRequest, NextResponse } from 'next/server'
import { restoreStockForOrder, resolveEmailConfig } from '@merkiai/database'
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

    // Inventario: al cancelar un pedido se repone el stock descontado (idempotente)
    if (status === 'cancelled' && order) {
      await restoreStockForOrder(order.order_number).catch((e) => console.error('[status] stock restore:', e))
    }

    // ── Email al cliente — no bloquea la respuesta si falla ──────────────────
    // La config se resuelve en el path (lectura rápida) y se registra en los logs
    // del proyecto ADMIN; el envío real va async (no demora la respuesta).
    if (NOTIFIABLE_STATUSES.has(status) && order) {
      const ec = await resolveEmailConfig(supabase, adminUser.tenantId).catch((e) => {
        console.error('[status/route] resolveEmailConfig throw:', e instanceof Error ? e.message : String(e))
        return null
      })
      console.warn(`[status/route] status=${status} tenant=${adminUser.tenantId} emailConfig=${ec ? `ok(${ec.provider}, from=${ec.fromEmail})` : 'NULL → no envía'}`)

      if (ec) {
        const emailConfig = { apiKey: ec.apiKey, fromEmail: ec.fromEmail, storeName: ec.storeName }
        void (async () => {
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
          } catch (emailErr) {
            console.error('[status/route] email error:', emailErr)
          }
        })()
      }
    }

    return NextResponse.json(order)
  } catch (err) {
    return NextResponse.json({ error: 'Error actualizando estado' }, { status: 500 })
  }
}
