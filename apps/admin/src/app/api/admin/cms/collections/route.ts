/**
 * /api/admin/cms/collections — HU-353 (Fase 2)
 *
 * CRUD de definiciones de colección (tipos de contenido dinámicos). Acotado por
 * tenant vía RLS (getAdminDb). Gated por el entitlement `colecciones` (HU-359) y
 * el límite `max_colecciones` (fail-open si no hay control-plane).
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import {
  listCollections, createCollection, updateCollection, deleteCollection, countCollections,
} from '@merkiai/database'
import {
  getTenantEntitlements, requireFeature, enforceLimit, EntitlementError, FEATURES, LIMITS,
} from '@/lib/entitlements'

async function requireAdmin() {
  const adminUser = await getAdminUser()
  if (!adminUser) return { adminUser: null, error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  return { adminUser, error: null }
}

function entitlementResponse(e: unknown): NextResponse | null {
  if (e instanceof EntitlementError) {
    return NextResponse.json({ error: e.message, code: e.code, key: e.key }, { status: e.kind === 'limit' ? 403 : 402 })
  }
  return null
}

export async function GET() {
  const { adminUser, error } = await requireAdmin()
  if (error) return error
  const db = getAdminDb(adminUser!.tenantId)
  try {
    return NextResponse.json(await listCollections(db))
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { adminUser, error } = await requireAdmin()
  if (error) return error
  const db = getAdminDb(adminUser!.tenantId)
  const body = await req.json()
  if (!body?.key || !body?.label) {
    return NextResponse.json({ error: 'key y label son requeridos' }, { status: 400 })
  }

  // HU-359 · feature + límite de colecciones (fail-open sin control-plane).
  const { entitlements } = await getTenantEntitlements(adminUser!.tenantId)
  if (entitlements) {
    try {
      requireFeature(entitlements, FEATURES.COLLECTIONS)
      enforceLimit(entitlements, LIMITS.MAX_COLLECTIONS, await countCollections(db))
    } catch (e) {
      const r = entitlementResponse(e); if (r) return r; throw e
    }
  }

  try {
    const created = await createCollection({ ...body, tenant_id: adminUser!.tenantId }, db)
    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const { adminUser, error } = await requireAdmin()
  if (error) return error
  const db = getAdminDb(adminUser!.tenantId)
  const body = await req.json()
  if (!body?.key) return NextResponse.json({ error: 'key requerido' }, { status: 400 })
  const { key, ...patch } = body
  try {
    return NextResponse.json(await updateCollection(key, patch, db))
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { adminUser, error } = await requireAdmin()
  if (error) return error
  const db = getAdminDb(adminUser!.tenantId)
  const key = new URL(req.url).searchParams.get('key')
  if (!key) return NextResponse.json({ error: 'key requerido' }, { status: 400 })
  try {
    await deleteCollection(key, db)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
