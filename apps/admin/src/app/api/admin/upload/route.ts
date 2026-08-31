import { createServerClient, getStorageProvider } from '@merkiai/database'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

// Storage requiere service-role → `createServerClient` es legítimo aquí, pero
// queda confinado al BORDE: se inyecta en el StorageProvider, que construye TODA
// clave con el `tenantId` como prefijo de path (aislamiento por tenant) y valida
// pertenencia antes de borrar. El registro en `media_assets` se acota por RLS.
export async function POST(req: NextRequest) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const folder = (formData.get('bucket') as string) ?? 'products'

  if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type))
    return NextResponse.json({ error: 'Tipo de archivo no permitido. Usa JPG, PNG o WebP.' }, { status: 400 })
  if (file.size > MAX_SIZE)
    return NextResponse.json({ error: 'El archivo excede 5 MB' }, { status: 400 })

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const storage = getStorageProvider({ client: createServerClient() })

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

  // Registrar en media_assets (acotado por RLS del admin) si se solicitó.
  const register = formData.get('register') === 'true'
  if (register) {
    const altText = (formData.get('alt_text') as string | null) ?? ''
    const db = createServerClient()
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

  const storage = getStorageProvider({ client: createServerClient() })
  try {
    // El provider valida ownsKey(tenant, key) → borrado cruzado bloqueado.
    await storage.remove(adminUser.tenantId, key)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error al borrar' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
