import {
  createServerClient, getStorageProvider, s3ConfigFromEnv, isStorageFolder,
  getStorageUsage, recordStorageObject, removeStorageObject, checkStorageQuota,
} from '@merkiai/database'
import { getTenantEntitlements, resolveLimit, LIMITS } from '@/lib/entitlements'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

/**
 * Proveedor de storage del entorno (HU-432): `supabase` (default) o `r2`/`s3`
 * (S3-compatible, firma SigV4). Mismo formato de clave en todos.
 */
function storageForRequest() {
  const provider = process.env.STORAGE_PROVIDER || 'supabase'
  return getStorageProvider({
    provider,
    client: provider === 'supabase' ? createServerClient() : undefined,
    s3: provider === 'supabase' ? null : s3ConfigFromEnv(),
  })
}

// Storage requiere service-role → `createServerClient` es legítimo aquí, pero
// queda confinado al BORDE: se inyecta en el StorageProvider, que construye TODA
// clave con el `tenantId` como prefijo de path (aislamiento por tenant) y valida
// pertenencia antes de borrar. El registro en `media_assets` se acota por RLS.
export async function POST(req: NextRequest) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const folderRaw = (formData.get('bucket') as string | null) ?? 'products'
  // HU-432: solo carpetas conocidas (antes cualquier texto podía crear un bucket).
  if (!isStorageFolder(folderRaw)) return NextResponse.json({ error: 'Carpeta de destino no permitida.' }, { status: 400 })
  const folder = folderRaw

  if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type))
    return NextResponse.json({ error: 'Tipo de archivo no permitido. Usa JPG, PNG o WebP.' }, { status: 400 })
  if (file.size > MAX_SIZE)
    return NextResponse.json({ error: 'El archivo excede 5 MB' }, { status: 400 })

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  // HU-432 · tope de almacenamiento del plan (`max_medios_mb`; sin límite = ilimitado).
  // Regla de negocio fail-open: si no se puede medir, no se bloquea la subida.
  const db = getAdminDb(adminUser.tenantId)
  const [usage, ent] = await Promise.all([
    getStorageUsage(db, adminUser.tenantId).catch(() => ({ bytes: 0, objects: 0 })),
    getTenantEntitlements(adminUser.tenantId).catch(() => ({ entitlements: null })),
  ])
  const quota = checkStorageQuota(usage.bytes, file.size, resolveLimit(ent.entitlements, LIMITS.MAX_MEDIA_MB))
  if (!quota.ok) return NextResponse.json({ error: quota.message }, { status: 413 })

  let storage
  try {
    storage = storageForRequest()
  } catch (e) {
    console.error('[upload]', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'El almacenamiento no está configurado.' }, { status: 503 })
  }

  let object
  try {
    object = await storage.upload({
      tenantId: adminUser.tenantId,
      folder,
      filename,
      contentType: file.type,
      body: await file.arrayBuffer(),
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error al subir' }, { status: 500 })
  }

  // HU-432 · inventario para medir el uso (best-effort: la subida ya es válida).
  await recordStorageObject(db, {
    tenantId: adminUser.tenantId, provider: storage.name, key: object.key, folder, sizeBytes: file.size, contentType: file.type,
  }).catch((e) => console.error('[upload] no se registró el uso', e instanceof Error ? e.message : e))

  // Registrar en media_assets (acotado por RLS del admin) si se solicitó.
  const register = formData.get('register') === 'true'
  if (register) {
    const altText = (formData.get('alt_text') as string | null) ?? ''
    // HU-158: el registro de datos del tenant va por el cliente RLS-scoped del
    // admin (no service-role), para que la política admin_all acote por tenant.
    await db.from('media_assets').insert({
      key:        object.key,
      url:        object.url,
      bucket:     folder,
      mime_type:  file.type,
      size_bytes: file.size,
      alt_text:   altText || null,
      used_in:    [],
      tenant_id:  adminUser.tenantId,
    }).select().single()
    // Si falla el registro, el upload sigue siendo válido.
  }

  // `filename` se mantiene por compatibilidad; `key` es la clave estable real.
  return NextResponse.json({ url: object.url, filename, key: object.key })
}

export async function DELETE(req: NextRequest) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  // Preferir `key` (clave estable con tenant). `filename`+`bucket` = compat legacy.
  const key: string | undefined = body.key
    ?? (body.filename ? `${body.bucket ?? 'products'}/${body.filename}` : undefined)
  if (!key) return NextResponse.json({ error: 'key (o filename) requerido' }, { status: 400 })

  try {
    // El provider valida ownsKey(tenant, key) → borrado cruzado bloqueado.
    await storageForRequest().remove(adminUser.tenantId, key)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error al borrar' }, { status: 500 })
  }
  await removeStorageObject(getAdminDb(adminUser.tenantId), adminUser.tenantId, key)
    .catch((e) => console.error('[upload] no se descontó el uso', e instanceof Error ? e.message : e))
  return NextResponse.json({ ok: true })
}
