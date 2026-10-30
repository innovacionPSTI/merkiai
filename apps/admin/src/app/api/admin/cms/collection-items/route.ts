/**
 * /api/admin/cms/collection-items — HU-353 (Fase 2)
 *
 * CRUD de registros de una colección. `data` se valida contra el esquema de la
 * colección en la capa de datos (422 si falla). Acotado por tenant vía RLS.
 * Gated por el entitlement `colecciones` + límite `max_registros_coleccion`.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import {
  listCollectionItems, createCollectionItem, updateCollectionItem, deleteCollectionItem,
  countCollectionItems, CollectionValidationError,
} from '@merkiai/database'
import {
  getTenantEntitlements, requireFeature, enforceLimit, EntitlementError, FEATURES, LIMITS,
} from '@/lib/entitlements'

async function requireAdmin() {
  const adminUser = await getAdminUser()
  if (!adminUser) return { adminUser: null, error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  return { adminUser, error: null }
}

function mapError(e: unknown): NextResponse {
  if (e instanceof CollectionValidationError) {
    return NextResponse.json({ error: 'Datos inválidos', details: e.errors }, { status: 422 })
  }
  if (e instanceof EntitlementError) {
    return NextResponse.json({ error: e.message, code: e.code, key: e.key }, { status: e.kind === 'limit' ? 403 : 402 })
  }
  return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
}

export async function GET(req: NextRequest) {
  const { adminUser, error } = await requireAdmin()
  if (error) return error
  const db = getAdminDb(adminUser!.tenantId)
  const collectionKey = new URL(req.url).searchParams.get('collection_key')
  if (!collectionKey) return NextResponse.json({ error: 'collection_key requerido' }, { status: 400 })
  try {
    return NextResponse.json(await listCollectionItems(db, { collectionKey }))
  } catch (e) {
    return mapError(e)
  }
}

export async function POST(req: NextRequest) {
  const { adminUser, error } = await requireAdmin()
  if (error) return error
  const db = getAdminDb(adminUser!.tenantId)
  const body = await req.json()
  if (!body?.collection_key) return NextResponse.json({ error: 'collection_key requerido' }, { status: 400 })

  const { entitlements } = await getTenantEntitlements(adminUser!.tenantId)
  if (entitlements) {
    try {
      requireFeature(entitlements, FEATURES.COLLECTIONS)
      enforceLimit(entitlements, LIMITS.MAX_COLLECTION_RECORDS, await countCollectionItems(body.collection_key, db))
    } catch (e) { return mapError(e) }
  }

  try {
    const created = await createCollectionItem({ ...body, tenant_id: adminUser!.tenantId }, db)
    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    return mapError(e)
  }
}

export async function PATCH(req: NextRequest) {
  const { adminUser, error } = await requireAdmin()
  if (error) return error
  const db = getAdminDb(adminUser!.tenantId)
  const body = await req.json()
  if (!body?.id || !body?.collection_key) {
    return NextResponse.json({ error: 'id y collection_key requeridos' }, { status: 400 })
  }
  const { id, collection_key, ...patch } = body
  try {
    return NextResponse.json(await updateCollectionItem(Number(id), collection_key, patch, db))
  } catch (e) {
    return mapError(e)
  }
}

export async function DELETE(req: NextRequest) {
  const { adminUser, error } = await requireAdmin()
  if (error) return error
  const db = getAdminDb(adminUser!.tenantId)
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })
  try {
    await deleteCollectionItem(Number(id), db)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return mapError(e)
  }
}
