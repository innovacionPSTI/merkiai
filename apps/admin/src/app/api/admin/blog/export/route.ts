import { objectsToCsv } from '@merkiai/database'
import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { canAccess } from '@/lib/roles'

/** GET → exporta posts del blog a CSV compatible con el importador (HU-132). RLS. */
export async function GET() {
  const user = await getAdminUser()
  if (!user || !canAccess(user.role, 'blog')) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const db = getAdminDb(user.tenantId)
  const { data, error } = await db
    .from('blog_posts')
    .select('slug, title, excerpt, content, cover_image, category, published, published_at, seo_title, seo_desc')
    .order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const headers = ['slug', 'title', 'excerpt', 'content', 'cover_image', 'category', 'published', 'published_at', 'seo_title', 'seo_desc']
  const rows = (data ?? []).map((p: any) => ({
    ...p,
    published: p.published ? 'true' : 'false',
    published_at: p.published_at ? String(p.published_at).slice(0, 10) : '',
  }))

  const date = new Date().toISOString().slice(0, 10)
  return new NextResponse(objectsToCsv(headers, rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="blog-${date}.csv"`,
    },
  })
}
