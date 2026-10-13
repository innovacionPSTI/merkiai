import { NextRequest, NextResponse } from 'next/server'
import { listInstances } from '@merkiai/database'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'

/**
 * Verificación de instancia de ENVÍO (ADR-004 · HU-278).
 * Para Skydropx: intenta un intercambio OAuth client_credentials contra el host
 * del API correcto según el entorno, para validar credenciales y conectividad
 * (así el error se ve en el admin y no solo al cotizar en el checkout).
 */
function skydropxApiBase(environment?: string, override?: string): string {
  if (override && /^https?:\/\//i.test(override) && !/app\.skydropx\.com|\/users\/|merchant_stores/i.test(override)) {
    return override.replace(/\/$/, '')
  }
  return environment === 'production' ? 'https://api-pro.skydropx.com' : 'https://sb-pro.skydropx.com'
}

export async function POST(req: NextRequest) {
  const u = await getAdminUser()
  if (!u) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await req.json().catch(() => ({ id: undefined }))
  if (!id) return NextResponse.json({ ok: false, detail: 'Falta el id de la instancia' }, { status: 400 })

  const instances = await listInstances(getAdminDb(u.tenantId), u.tenantId, 'shipping').catch(() => [])
  const inst = instances.find((i) => i.id === id)
  if (!inst) return NextResponse.json({ ok: false, detail: 'Instancia no encontrada' }, { status: 404 })

  if (inst.provider !== 'skydropx') {
    return NextResponse.json({ ok: false, supported: false, detail: 'verificación automática no disponible' })
  }

  const c = (inst.credentials ?? {}) as Record<string, string | undefined>
  const s = (inst.settings ?? {}) as Record<string, unknown>
  if (!c.client_id || !c.client_secret) {
    return NextResponse.json({ ok: false, detail: 'Faltan Client ID / Client Secret' })
  }

  const base = skydropxApiBase(inst.environment, s.base_url as string | undefined)
  try {
    const res = await fetch(`${base}/api/v1/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: c.client_id,
        client_secret: c.client_secret,
      }).toString(),
    })
    if (res.ok) {
      const data = await res.json().catch(() => ({}))
      if (data.access_token) return NextResponse.json({ ok: true, detail: `Conectado a ${base}` })
      return NextResponse.json({ ok: false, detail: 'El host respondió sin access_token' })
    }
    const body = await res.text().catch(() => '')
    return NextResponse.json({ ok: false, detail: `OAuth ${res.status} en ${base}${body ? ` — ${body.slice(0, 200)}` : ''}` })
  } catch (err) {
    return NextResponse.json({ ok: false, detail: `No se pudo conectar a ${base}: ${err instanceof Error ? err.message : 'error de red'}` })
  }
}
