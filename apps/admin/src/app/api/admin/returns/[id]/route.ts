import { setReturnStatus, restoreStockForOrder } from '@merkiai/database'
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

  // Reposición de stock al aprobar (idempotente: solo repone si se había descontado).
  if (status === 'approved' && restock) {
    await restoreStockForOrder(res.returnRow.order_number).catch((e) =>
      console.error('[returns] restock:', e instanceof Error ? e.message : e),
    )
  }

  return NextResponse.json({ ok: true, return: res.returnRow })
}
