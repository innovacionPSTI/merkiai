import { NextRequest } from 'next/server'
import { NextResponse } from '@/lib/api-response'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { getTenantEntitlements, resolveLimit, LIMITS } from '@/lib/entitlements'

/**
 * HU-367 AC-3 / HU-369 · niveles de navegación por plan (`max_niveles_nav`):
 * 1 = solo nivel raíz (sin subelementos). Sin límite o sin control-plane → 2
 * (el máximo que soporta el menú). Devuelve el mensaje si se excede.
 */
async function navDepthDenied(tenantId: string, parentId: unknown): Promise<string | null> {
  if (parentId === null || parentId === undefined || parentId === '') return null
  const { entitlements } = await getTenantEntitlements(tenantId).catch(() => ({ entitlements: null }))
  const max = entitlements ? resolveLimit(entitlements, LIMITS.MAX_NAV_DEPTH) : null
  return max !== null && max < 2 ? 'Tu plan permite un solo nivel de menú (sin subelementos).' : null
}

export async function GET() {
  try {
    const adminUser = await getAdminUser()
    if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const supabase = getAdminDb(adminUser.tenantId)
    const { data, error } = await supabase
      .from('nav_items')
      .select('*')
      .order('order_index')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminUser = await getAdminUser()
    if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const body = await req.json()
    const { label, href, enabled, order_index, parent_id } = body
    if (!label) return NextResponse.json({ error: 'label requerido' }, { status: 400 })
    const depthDenied = await navDepthDenied(adminUser.tenantId, parent_id)
    if (depthDenied) return NextResponse.json({ error: depthDenied, code: 'limit', key: LIMITS.MAX_NAV_DEPTH }, { status: 403 })

    const supabase = getAdminDb(adminUser.tenantId)
    const { data, error } = await supabase
      .from('nav_items')
      .insert({
        tenant_id: adminUser.tenantId,
        label,
        href: href || null,
        enabled: enabled ?? true,
        order_index: order_index ?? 0,
        parent_id: parent_id ?? null,
      })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const adminUser = await getAdminUser()
    if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const body = await req.json()
    const { id, ...fields } = body
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })
    const depthDenied = 'parent_id' in fields ? await navDepthDenied(adminUser.tenantId, fields.parent_id) : null
    if (depthDenied) return NextResponse.json({ error: depthDenied, code: 'limit', key: LIMITS.MAX_NAV_DEPTH }, { status: 403 })

    const supabase = getAdminDb(adminUser.tenantId)
    const { data, error } = await supabase
      .from('nav_items')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const adminUser = await getAdminUser()
    if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

    const supabase = getAdminDb(adminUser.tenantId)
    const { error } = await supabase.from('nav_items').delete().eq('id', Number(id))
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
}
