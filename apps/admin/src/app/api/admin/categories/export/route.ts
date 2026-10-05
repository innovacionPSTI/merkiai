import { objectsToCsv } from '@merkiai/database'
import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'

/**
 * GET → exporta categorías a CSV compatible con el importador (HU-132). La
 * jerarquía se emite como `parent_slug` (resuelto desde `parent_id`). RLS.
 */
export async function GET() {
  const user = await getAdminUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const db = getAdminDb(user.tenantId)
  const { data, error } = await db
    .from('categories')
    .select('id, slug, name, description, parent_id, meta_title, meta_description, image_url, active, order_index')
    .order('order_index')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const slugById = new Map<number, string>((data ?? []).map((c: any) => [c.id, c.slug]))
  const headers = ['slug', 'name', 'description', 'parent_slug', 'meta_title', 'meta_description', 'image_url', 'active', 'order_index']
  const rows = (data ?? []).map((c: any) => ({
    ...c,
    parent_slug: c.parent_id != null ? slugById.get(c.parent_id) ?? '' : '',
    active: c.active ? 'true' : 'false',
  }))

  const date = new Date().toISOString().slice(0, 10)
  return new NextResponse(objectsToCsv(headers, rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="categorias-${date}.csv"`,
    },
  })
}
