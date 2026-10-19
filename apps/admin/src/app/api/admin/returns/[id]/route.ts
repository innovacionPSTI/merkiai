import { setReturnStatus, restoreStockForOrder, logAudit, addStoreCredit } from '@merkiai/database'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { userCanAccess } from '@/lib/roles'

/**
 * PATCH { status: 'approved'|'rejected', restock?: boolean } → resuelve una
 * devolución (HU-107a). Al aprobar con `restock`, repone el stock del pedido
 * (idempotente, reusa el RPC de inventario). Gated por acceso a Pedidos.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAdminUser()
  if (!user || !userCanAccess(user, 'pedidos')) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const returnId = Number(id)
  if (!Number.isInteger(returnId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const status = body?.status
  const restock = body?.restock === true
  if (status !== 'approved' && status !== 'rejected') {
    return NextResponse.json({ error: 'status debe ser "approved" o "rejected"' }, { status: 400 })
  }

  const db = getAdminDb(user.tenantId)
  const res = await setReturnStatus(db, returnId, status, { restocked: restock })
  if (!res.ok || !res.returnRow) return NextResponse.json({ error: res.error ?? 'No se pudo actualizar' }, { status: 500 })

  await logAudit(db, {
    tenantId: user.tenantId, actorEmail: user.email, actorRole: user.role,
    action: 'return.resolve', entity: 'order', entityId: res.returnRow.order_number,
    summary: `Devolución de ${res.returnRow.order_number} → ${status}${status === 'approved' && restock ? ' (stock repuesto)' : ''}`,
    metadata: { return_id: returnId, status, restock },
  })

  // Reposición de stock al aprobar (idempotente: solo repone si se había descontado).
  if (status === 'approved' && restock) {
    await restoreStockForOrder(res.returnRow.order_number).catch((e) =>
      console.error('[returns] restock:', e instanceof Error ? e.message : e),
    )
  }

  // HU-148 (AC-3) · reembolso como saldo a favor. Al aprobar, si se indica un
  // monto de crédito y el pedido tiene cliente registrado, se abona al ledger.
  const creditAmount = Math.round(Number(body?.creditAmount))
  if (status === 'approved' && Number.isFinite(creditAmount) && creditAmount > 0) {
    try {
      const { data: order } = await db
        .from('orders').select('id, customer_id').eq('order_number', res.returnRow.order_number).maybeSingle()
      if (order?.customer_id) {
        await addStoreCredit(
          { customerId: order.customer_id as string, delta: creditAmount, reason: 'refund', orderId: order.id as number },
          db, user.tenantId,
        )
        await logAudit(db, {
          tenantId: user.tenantId, actorEmail: user.email, actorRole: user.role,
          action: 'return.credit', entity: 'order', entityId: res.returnRow.order_number,
          summary: `Reembolso como saldo a favor: ${creditAmount} (pedido ${res.returnRow.order_number})`,
          metadata: { return_id: returnId, creditAmount },
        })
      }
    } catch (e) {
      console.error('[returns] store credit:', e instanceof Error ? e.message : e)
    }
  }

  return NextResponse.json({ ok: true, return: res.returnRow })
}
