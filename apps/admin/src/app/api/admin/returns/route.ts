import { createReturn, validateReturn, logAudit } from '@merkiai/database'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { userCanAccess } from '@/lib/roles'

/**
 * POST → registra una devolución (RMA) de un pedido (HU-107a). Gated por acceso
 * a Pedidos; acotado por tenant vía RLS (is_admin). Estado inicial `requested`.
 */
export async function POST(req: NextRequest) {
  const user = await getAdminUser()
  if (!user || !userCanAccess(user, 'pedidos')) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const input = {
    order_id: Number(body?.order_id),
    order_number: String(body?.order_number ?? ''),
    reason: body?.reason != null ? String(body.reason) : null,
    note: body?.note != null ? String(body.note) : null,
  }
  const invalid = validateReturn(input)
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 })

  const db = getAdminDb(user.tenantId)
  const res = await createReturn(db, input, user.tenantId)
  if (!res.ok) return NextResponse.json({ error: res.error ?? 'No se pudo registrar la devolución' }, { status: 500 })
  await logAudit(db, {
    tenantId: user.tenantId, actorEmail: user.email, actorRole: user.role,
    action: 'return.create', entity: 'order', entityId: input.order_number,
    summary: `Devolución registrada para ${input.order_number}`, metadata: { return_id: res.id, reason: input.reason },
  })
  return NextResponse.json({ ok: true, id: res.id }, { status: 201 })
}
