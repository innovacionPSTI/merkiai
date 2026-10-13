import { NextRequest, NextResponse } from 'next/server'
import { listInstances, createInstance, getProviderDef, PAYMENT_PROVIDERS } from '@merkiai/database'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { maskInstance } from '@/lib/mask-instance'

/**
 * Instancias de pago del tenant (ADR-004 · HU-276).
 *   GET  → lista (credenciales enmascaradas).
 *   POST → crea una instancia { provider, label?, environment?, credentials, settings? }.
 */
export async function GET() {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try {
    const list = await listInstances(getAdminDb(adminUser.tenantId), adminUser.tenantId, 'payment')
    return NextResponse.json({ instances: list.map((i) => maskInstance(i, getProviderDef('payment', i.provider))) })
  } catch (err) {
    console.error('[payment-instances GET]', err)
    return NextResponse.json({ error: 'Error cargando medios de pago' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try {
    const body = await req.json() as {
      provider?: string; label?: string | null; environment?: 'test' | 'production'
      credentials?: Record<string, string>; settings?: Record<string, unknown>
    }
    const def = body.provider ? getProviderDef('payment', body.provider) : undefined
    if (!def) return NextResponse.json({ error: `Pasarela inválida. Opciones: ${PAYMENT_PROVIDERS.map((p) => p.provider).join(', ')}` }, { status: 400 })

    // Validación básica: public_key de Wompi debe empezar con pub_.
    const creds = cleanCreds(body.credentials)
    if (body.provider === 'wompi' && creds.public_key && !creds.public_key.startsWith('pub_')) {
      return NextResponse.json({ error: 'La llave pública de Wompi debe comenzar con "pub_"' }, { status: 400 })
    }

    const inst = await createInstance(getAdminDb(adminUser.tenantId), {
      tenantId: adminUser.tenantId,
      kind: 'payment',
      provider: body.provider!,
      label: body.label ?? null,
      environment: body.environment ?? 'test',
      credentials: creds,
      settings: body.settings ?? {},
    })
    return NextResponse.json({ instance: maskInstance(inst, def) })
  } catch (err) {
    console.error('[payment-instances POST]', err)
    return NextResponse.json({ error: 'Error creando el medio de pago' }, { status: 500 })
  }
}

/** Descarta credenciales vacías (no se guardan strings en blanco). */
function cleanCreds(creds?: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(creds ?? {})) {
    if (typeof v === 'string' && v.trim()) out[k] = v.trim()
  }
  return out
}
