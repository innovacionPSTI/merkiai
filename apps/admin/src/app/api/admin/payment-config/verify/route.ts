import { NextRequest, NextResponse } from 'next/server'
import { getPaymentConfig } from '@merkiai/database'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'

/**
 * POST /api/admin/payment-config/verify  { provider }
 *
 * Verificación ligera de credenciales por pasarela (HU-273): un ping autenticado
 * a la API del proveedor para detectar llaves inválidas ANTES de que un cliente
 * intente pagar. No expone secretos; solo devuelve { ok, supported, detail }.
 *   - supported:false → la pasarela no tiene verificación automática.
 */
export async function POST(req: NextRequest) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { provider } = await req.json().catch(() => ({})) as { provider?: string }
  const config = await getPaymentConfig(getAdminDb(adminUser.tenantId), adminUser.tenantId).catch(() => null)
  if (!config) return NextResponse.json({ ok: false, supported: true, detail: 'no hay configuración de pagos' })

  try {
    if (provider === 'wompi') {
      const pub = config.wompi_public_key
      if (!pub) return NextResponse.json({ ok: false, supported: true, detail: 'falta la llave pública' })
      const base = pub.startsWith('pub_test_') ? 'https://sandbox.wompi.co' : 'https://production.wompi.co'
      // La llave pública válida devuelve el comercio (endpoint público de Wompi).
      const mr = await fetch(`${base}/v1/merchants/${encodeURIComponent(pub)}`)
      if (!mr.ok) return NextResponse.json({ ok: false, supported: true, detail: 'la llave pública no es válida para el entorno (pruebas/producción)' })
      // Si hay llave privada, validarla con una consulta autenticada.
      if (config.wompi_private_key) {
        const tr = await fetch(`${base}/v1/transactions`, { headers: { Authorization: `Bearer ${config.wompi_private_key}` } })
        if (tr.status === 401 || tr.status === 403) {
          return NextResponse.json({ ok: false, supported: true, detail: 'la llave privada no es válida' })
        }
      }
      // Nota: el secreto de integridad no tiene endpoint de validación; se verifica
      // de facto en el primer checkout (firma). Avisamos como detalle informativo.
      return NextResponse.json({ ok: true, supported: true, detail: 'llaves válidas (la integridad se confirma en el primer pago)' })
    }

    if (provider === 'mercadopago') {
      const tok = config.mercadopago_access_token
      if (!tok) return NextResponse.json({ ok: false, supported: true, detail: 'falta el access token' })
      const r = await fetch('https://api.mercadopago.com/users/me', { headers: { Authorization: `Bearer ${tok}` } })
      return NextResponse.json(r.ok ? { ok: true, supported: true } : { ok: false, supported: true, detail: 'el access token no es válido' })
    }

    // Tu Compra / Bold: sin ping de verificación simple; se validan al primer pago.
    return NextResponse.json({ ok: false, supported: false, detail: 'verificación automática no disponible' })
  } catch (err) {
    console.error('[payment-config/verify]', err)
    return NextResponse.json({ ok: false, supported: true, detail: 'no se pudo contactar a la pasarela' })
  }
}
