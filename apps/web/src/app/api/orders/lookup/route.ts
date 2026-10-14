import { NextRequest, NextResponse } from 'next/server'
import { getOrderForGuest } from '@merkiai/database'
import { resolveTenant } from '@/lib/tenant-context'
import { getMachineDb } from '@/lib/machine-db'

export const dynamic = 'force-dynamic'

/**
 * POST { order_number, email } → consulta de pedido como invitado (HU-150).
 * Verificación server-side: solo devuelve el pedido si número + email coinciden,
 * y un subconjunto SEGURO (sin dirección/teléfono/correo). Mensaje neutro si no
 * coincide (no revela si el número existe). Lectura con machine-db del tenant.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const orderNumber = String(body?.order_number ?? '').trim()
  const email = String(body?.email ?? '').trim()
  if (!orderNumber || !email) {
    return NextResponse.json({ error: 'Ingresa el número de pedido y tu correo.' }, { status: 400 })
  }
  try {
    const { tenantId } = await resolveTenant()
    const db = getMachineDb(tenantId)
    const order = await getOrderForGuest(db, orderNumber, email, tenantId).catch(() => null)
    if (!order) {
      // Neutro: no revela si el número existe.
      return NextResponse.json({ error: 'No encontramos un pedido con esos datos. Revisa el número y el correo.' }, { status: 404 })
    }
    return NextResponse.json({ order })
  } catch {
    return NextResponse.json({ error: 'No se pudo consultar el pedido.' }, { status: 500 })
  }
}
