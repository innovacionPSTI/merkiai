import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'

type BatchAction = 'activate' | 'deactivate' | 'feature' | 'unfeature' | 'set_category' | 'delete'

/**
 * POST → acción masiva sobre productos (HU-131). Acotado por tenant vía RLS
 * (getAdminDb): un `.in('id', ids)` solo alcanza los productos del tenant.
 * Body: { ids: number[], action, category_id? }
 */
export async function POST(req: NextRequest) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const ids: number[] = Array.isArray(body?.ids) ? body.ids.filter((n: unknown) => Number.isInteger(n)) : []
  const action: BatchAction = body?.action
  if (ids.length === 0) return NextResponse.json({ error: 'Sin productos seleccionados' }, { status: 400 })

  const supabase = getAdminDb(adminUser.tenantId)

  let error: { message: string } | null = null

  switch (action) {
    case 'activate':
      ({ error } = await supabase.from('products').update({ active: true }).in('id', ids)); break
    case 'deactivate':
      ({ error } = await supabase.from('products').update({ active: false }).in('id', ids)); break
    case 'feature':
      ({ error } = await supabase.from('products').update({ featured: true }).in('id', ids)); break
    case 'unfeature':
      ({ error } = await supabase.from('products').update({ featured: false }).in('id', ids)); break
    case 'set_category': {
      const category_id = body?.category_id === null || body?.category_id === ''
        ? null
        : Number(body?.category_id)
      if (category_id !== null && !Number.isInteger(category_id))
        return NextResponse.json({ error: 'Categoría inválida' }, { status: 400 })
      ;({ error } = await supabase.from('products').update({ category_id }).in('id', ids))
      break
    }
    case 'delete':
      // Las variantes se eliminan primero (FK). RLS confina al tenant.
      await supabase.from('product_variants').delete().in('product_id', ids)
      ;({ error } = await supabase.from('products').delete().in('id', ids)); break
    default:
      return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 })
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, affected: ids.length, action })
}
