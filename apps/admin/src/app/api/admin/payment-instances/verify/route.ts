import { NextRequest, NextResponse } from 'next/server'
import { listInstances } from '@merkiai/database'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'

/**
 * Verifica las credenciales de UNA instancia de pago (ADR-004 · HU-276/273).
 * Ping autenticado por proveedor para detectar llaves inválidas antes de cobrar.
 * No expone secretos; devuelve { ok, supported, detail }.
 */
export async function POST(req: NextRequest) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await req.json().catch(() => ({})) as { id?: string }
  const list = await listInstances(getAdminDb(adminUser.tenantId), adminUser.tenantId, 'payment').catch(() => [])
  const inst = list.find((i) => i.id === id)
  if (!inst) return NextResponse.json({ ok: false, supported: true, detail: 'medio de pago no encontrado' })
  const c = inst.credentials as Record<string, string | undefined>

  try {
    if (inst.provider === 'wompi') {
      const pub = c.public_key
      if (!pub) return NextResponse.json({ ok: false, supported: true, detail: 'falta la llave pública' })
      const base = pub.startsWith('pub_test_') ? 'https://sandbox.wompi.co' : 'https://production.wompi.co'
      const mr = await fetch(`${base}/v1/merchants/${encodeURIComponent(pub)}`)
      if (!mr.ok) return NextResponse.json({ ok: false, supported: true, detail: 'la llave pública no es válida para el entorno' })
      if (c.private_key) {
        const tr = await fetch(`${base}/v1/transactions`, { headers: { Authorization: `Bearer ${c.private_key}` } })
        if (tr.status === 401 || tr.status === 403) return NextResponse.json({ ok: false, supported: true, detail: 'la llave privada no es válida' })
      }
      return NextResponse.json({ ok: true, supported: true, detail: 'llaves válidas (la integridad se confirma en el primer pago)' })
    }
    if (inst.provider === 'mercadopago') {
      if (!c.access_token) return NextResponse.json({ ok: false, supported: true, detail: 'falta el access token' })
      const r = await fetch('https://api.mercadopago.com/users/me', { headers: { Authorization: `Bearer ${c.access_token}` } })
      return NextResponse.json(r.ok ? { ok: true, supported: true } : { ok: false, supported: true, detail: 'el access token no es válido' })
    }
    return NextResponse.json({ ok: false, supported: false, detail: 'verificación automática no disponible' })
  } catch (err) {
    console.error('[payment-instances/verify]', err)
    return NextResponse.json({ ok: false, supported: true, detail: 'no se pudo contactar a la pasarela' })
  }
}
