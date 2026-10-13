import { NextRequest, NextResponse } from 'next/server'
import { listInstances, setActiveInstance, getProviderDef, missingRequired } from '@merkiai/database'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'

/**
 * Activa la instancia de pago indicada (ADR-004 · HU-276). `id: null` = ninguna
 * activa (→ pago manual). Antes de activar, valida credenciales requeridas para
 * no dejar el checkout apuntando a una pasarela que no puede cobrar.
 */
export async function POST(req: NextRequest) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try {
    const { id } = await req.json() as { id?: string | null }
    const db = getAdminDb(adminUser.tenantId)

    if (id) {
      const list = await listInstances(db, adminUser.tenantId, 'payment')
      const inst = list.find((i) => i.id === id)
      if (!inst) return NextResponse.json({ error: 'Medio de pago no encontrado' }, { status: 404 })
      const def = getProviderDef('payment', inst.provider)
      const missing = def ? missingRequired(def, inst.credentials as Record<string, string | undefined>) : []
      if (missing.length) {
        return NextResponse.json({ error: `Faltan credenciales para activar`, missing }, { status: 400 })
      }
    }

    await setActiveInstance(db, adminUser.tenantId, 'payment', id ?? null)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[payment-instances/activate]', err)
    return NextResponse.json({ error: 'Error activando el medio de pago' }, { status: 500 })
  }
}
