import { NextRequest } from 'next/server'
import { NextResponse } from '@/lib/api-response'
import { getAdminDb } from '@/lib/admin-db'
import { getAdminUser } from '@/lib/auth'
import { featureDeniedMessage, FEATURES } from '@/lib/entitlements'

async function requireEditor() {
  const user = await getAdminUser()
  if (!user) return { user: null, error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  const allowed = ['super_admin', 'admin', 'gestor_tienda']
  if (!allowed.includes(user.role)) {
    return { user: null, error: NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 }) }
  }
  return { user, error: null }
}

/** GET /api/admin/media — lista de assets */
export async function GET(req: NextRequest) {
  const { user, error } = await requireEditor()
  if (error) return error
  // HU-359 · el plan puede apagar la biblioteca de medios (la subida directa sigue).
  // El listado de "Archivos" sigue disponible; el selector (`picker=1`) es la biblioteca.
  const denied = new URL(req.url).searchParams.get('picker') === '1' ? await featureDeniedMessage(user!.tenantId, FEATURES.MEDIA_LIBRARY) : null
  if (denied) return NextResponse.json({ error: denied, code: 'feature', key: FEATURES.MEDIA_LIBRARY }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const mimeFilter = searchParams.get('mime') ?? undefined
  const limitParam = searchParams.get('limit')
  const limit = limitParam ? parseInt(limitParam, 10) : 200

  const supabase = getAdminDb(user!.tenantId)
  let query = supabase
    .from('media_assets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (mimeFilter) query = query.ilike('mime_type', `${mimeFilter}%`)

  const { data, error: dbError } = await query
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ assets: data ?? [] })
}

/** DELETE /api/admin/media?key=xxx — eliminar asset */
export async function DELETE(req: NextRequest) {
  const { user, error } = await requireEditor()
  if (error) return error

  const key = new URL(req.url).searchParams.get('key')
  if (!key) return NextResponse.json({ error: 'key requerido' }, { status: 400 })

  const supabase = getAdminDb(user!.tenantId)
  const { error: dbError } = await supabase.from('media_assets').delete().eq('key', key)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

/** PATCH /api/admin/media — actualizar alt_text */
export async function PATCH(req: NextRequest) {
  const { user, error } = await requireEditor()
  if (error) return error

  const body = await req.json() as { key: string; alt_text: string }
  if (!body.key) return NextResponse.json({ error: 'key requerido' }, { status: 400 })

  const supabase = getAdminDb(user!.tenantId)
  const { data, error: dbError } = await supabase
    .from('media_assets')
    .update({ alt_text: body.alt_text ?? null, updated_at: new Date().toISOString() })
    .eq('key', body.key)
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data)
}
