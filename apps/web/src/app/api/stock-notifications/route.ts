import { subscribeStockNotification, isValidEmail } from '@merkiai/database'
import { NextRequest, NextResponse } from 'next/server'
import { getRequestCatalogDb } from '@/lib/tenant-db'
import { resolveTenant } from '@/lib/tenant-context'

export const dynamic = 'force-dynamic'

/**
 * POST → suscribe un correo a la reposición de una variante agotada (HU-105).
 * Acotado por tenant vía RLS (JWT anon con tenant_id). El `tenant_id` sale del
 * Host resuelto. Idempotente (no duplica suscripciones pendientes).
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const variantId = Number(body?.variant_id)
  const email = String(body?.email ?? '')

  if (!Number.isInteger(variantId)) return NextResponse.json({ error: 'Variante inválida.' }, { status: 400 })
  if (!isValidEmail(email)) return NextResponse.json({ error: 'Ingresa un correo válido.' }, { status: 400 })

  try {
    const { tenantId } = await resolveTenant()
    const db = await getRequestCatalogDb()
    const res = await subscribeStockNotification(db, variantId, email, tenantId)
    if (!res.ok) return NextResponse.json({ error: res.error ?? 'No se pudo suscribir' }, { status: 500 })
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'No se pudo registrar el aviso.' }, { status: 500 })
  }
}
