/**
 * Handlers compartidos de la API de instancias de integración (ADR-004 · HU-278).
 * Parametrizados por `kind` para reutilizarse en pagos/envíos/correo.
 */
import { NextRequest, NextResponse } from 'next/server'
import {
  listInstances, createInstance, updateInstance, removeInstance,
  setActiveInstance, getProviderDef, missingRequired, providersFor,
} from '@merkiai/database'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { maskInstance } from '@/lib/mask-instance'

type Kind = 'payment' | 'shipping' | 'email'

function cleanCreds(creds?: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(creds ?? {})) if (typeof v === 'string' && v.trim()) out[k] = v.trim()
  return out
}

export async function listHandler(kind: Kind) {
  const u = await getAdminUser()
  if (!u) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try {
    const list = await listInstances(getAdminDb(u.tenantId), u.tenantId, kind)
    return NextResponse.json({ instances: list.map((i) => maskInstance(i, getProviderDef(kind, i.provider))) })
  } catch (err) {
    console.error(`[${kind}-instances GET]`, err)
    return NextResponse.json({ error: 'Error cargando configuraciones' }, { status: 500 })
  }
}

export async function createHandler(kind: Kind, req: NextRequest) {
  const u = await getAdminUser()
  if (!u) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try {
    const body = await req.json() as { provider?: string; label?: string | null; environment?: 'test' | 'production'; credentials?: Record<string, string>; settings?: Record<string, unknown> }
    const def = body.provider ? getProviderDef(kind, body.provider) : undefined
    if (!def) return NextResponse.json({ error: `Proveedor inválido. Opciones: ${providersFor(kind).map((p) => p.provider).join(', ')}` }, { status: 400 })
    const creds = cleanCreds(body.credentials)
    if (kind === 'payment' && body.provider === 'wompi' && creds.public_key && !creds.public_key.startsWith('pub_')) {
      return NextResponse.json({ error: 'La llave pública de Wompi debe comenzar con "pub_"' }, { status: 400 })
    }
    const inst = await createInstance(getAdminDb(u.tenantId), {
      tenantId: u.tenantId, kind, provider: body.provider!, label: body.label ?? null,
      environment: body.environment ?? 'test', credentials: creds, settings: body.settings ?? {},
    })
    return NextResponse.json({ instance: maskInstance(inst, def) })
  } catch (err) {
    console.error(`[${kind}-instances POST]`, err)
    return NextResponse.json({ error: 'Error creando la configuración' }, { status: 500 })
  }
}

export async function patchHandler(kind: Kind, id: string, req: NextRequest) {
  const u = await getAdminUser()
  if (!u) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try {
    const body = await req.json() as { label?: string | null; environment?: 'test' | 'production'; credentials?: Record<string, string>; settings?: Record<string, unknown>; enabled?: boolean }
    const creds = cleanCreds(body.credentials)
    const inst = await updateInstance(getAdminDb(u.tenantId), u.tenantId, id, {
      ...(body.label !== undefined ? { label: body.label } : {}),
      ...(body.environment !== undefined ? { environment: body.environment } : {}),
      ...(Object.keys(creds).length ? { credentials: creds } : {}),
      ...(body.settings !== undefined ? { settings: body.settings } : {}),
      ...(body.enabled !== undefined ? { enabled: body.enabled } : {}),
    })
    return NextResponse.json({ instance: maskInstance(inst, getProviderDef(kind, inst.provider)) })
  } catch (err) {
    console.error(`[${kind}-instances PATCH]`, err)
    return NextResponse.json({ error: 'Error actualizando la configuración' }, { status: 500 })
  }
}

export async function deleteHandler(id: string) {
  const u = await getAdminUser()
  if (!u) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try {
    await removeInstance(getAdminDb(u.tenantId), u.tenantId, id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[instances DELETE]', err)
    return NextResponse.json({ error: 'Error quitando la configuración' }, { status: 500 })
  }
}

export async function activateHandler(kind: Kind, req: NextRequest) {
  const u = await getAdminUser()
  if (!u) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try {
    const { id } = await req.json() as { id?: string | null }
    const db = getAdminDb(u.tenantId)
    if (id) {
      const list = await listInstances(db, u.tenantId, kind)
      const inst = list.find((i) => i.id === id)
      if (!inst) return NextResponse.json({ error: 'Configuración no encontrada' }, { status: 404 })
      const def = getProviderDef(kind, inst.provider)
      const missing = def ? missingRequired(def, inst.credentials as Record<string, string | undefined>) : []
      if (missing.length) return NextResponse.json({ error: 'Faltan credenciales para activar', missing }, { status: 400 })
    }
    await setActiveInstance(db, u.tenantId, kind, id ?? null)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(`[${kind}-instances activate]`, err)
    return NextResponse.json({ error: 'Error activando la configuración' }, { status: 500 })
  }
}
