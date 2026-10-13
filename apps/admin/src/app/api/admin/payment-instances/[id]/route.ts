import { NextRequest, NextResponse } from 'next/server'
import { updateInstance, removeInstance, getProviderDef } from '@merkiai/database'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { maskInstance } from '@/lib/mask-instance'

/** Editar (PATCH) o quitar (DELETE) una instancia de pago (ADR-004 · HU-276). */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params
  try {
    const body = await req.json() as {
      label?: string | null; environment?: 'test' | 'production'
      credentials?: Record<string, string>; settings?: Record<string, unknown>; enabled?: boolean
    }
    const creds = cleanCreds(body.credentials)
    const inst = await updateInstance(getAdminDb(adminUser.tenantId), adminUser.tenantId, id, {
      ...(body.label !== undefined ? { label: body.label } : {}),
      ...(body.environment !== undefined ? { environment: body.environment } : {}),
      ...(Object.keys(creds).length ? { credentials: creds } : {}),
      ...(body.settings !== undefined ? { settings: body.settings } : {}),
      ...(body.enabled !== undefined ? { enabled: body.enabled } : {}),
    })
    return NextResponse.json({ instance: maskInstance(inst, getProviderDef('payment', inst.provider)) })
  } catch (err) {
    console.error('[payment-instances PATCH]', err)
    return NextResponse.json({ error: 'Error actualizando el medio de pago' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params
  try {
    await removeInstance(getAdminDb(adminUser.tenantId), adminUser.tenantId, id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[payment-instances DELETE]', err)
    return NextResponse.json({ error: 'Error quitando el medio de pago' }, { status: 500 })
  }
}

function cleanCreds(creds?: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(creds ?? {})) {
    if (typeof v === 'string' && v.trim()) out[k] = v.trim()
  }
  return out
}
