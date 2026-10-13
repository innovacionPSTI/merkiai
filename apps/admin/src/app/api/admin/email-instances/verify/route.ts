import { NextRequest, NextResponse } from 'next/server'
import { listInstances } from '@merkiai/database'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'

/**
 * Verifica las credenciales de una instancia de CORREO (ADR-004 · HU-278).
 * Resend: ping autenticado a GET /domains. No expone secretos.
 */
export async function POST(req: NextRequest) {
  const u = await getAdminUser()
  if (!u) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await req.json().catch(() => ({})) as { id?: string }
  const list = await listInstances(getAdminDb(u.tenantId), u.tenantId, 'email').catch(() => [])
  const inst = list.find((i) => i.id === id)
  if (!inst) return NextResponse.json({ ok: false, supported: true, detail: 'configuración no encontrada' })
  const c = inst.credentials as Record<string, string | undefined>

  try {
    if (inst.provider === 'resend') {
      if (!c.api_key) return NextResponse.json({ ok: false, supported: true, detail: 'falta la API key' })
      const r = await fetch('https://api.resend.com/domains', { headers: { Authorization: `Bearer ${c.api_key}` } })
      if (r.status === 401 || r.status === 403) return NextResponse.json({ ok: false, supported: true, detail: 'la API key no es válida' })
      if (!r.ok) return NextResponse.json({ ok: false, supported: true, detail: 'no se pudo validar con Resend' })
      return NextResponse.json({ ok: true, supported: true, detail: 'API key válida (verifica que el remitente sea de un dominio verificado)' })
    }
    return NextResponse.json({ ok: false, supported: false, detail: 'verificación automática no disponible' })
  } catch (err) {
    console.error('[email-instances/verify]', err)
    return NextResponse.json({ ok: false, supported: true, detail: 'no se pudo contactar al proveedor' })
  }
}
