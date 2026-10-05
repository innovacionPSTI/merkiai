import { parseBlogPostsCsv, BLOG_IMPORT_TEMPLATE } from '@merkiai/database'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { canAccess } from '@/lib/roles'

/** GET → plantilla CSV de posts del blog. */
export async function GET() {
  const user = await getAdminUser()
  if (!user || !canAccess(user.role, 'blog')) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  return new NextResponse(BLOG_IMPORT_TEMPLATE, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="plantilla-blog.csv"',
    },
  })
}

/**
 * POST → importa posts del blog por CSV (HU-132). Identidad por `slug`. Acotado
 * por tenant vía RLS. Body: { csv, mode?: 'create'|'upsert', preview? }.
 */
export async function POST(req: NextRequest) {
  const user = await getAdminUser()
  if (!user || !canAccess(user.role, 'blog')) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const tenantId = user.tenantId

  const body = await req.json().catch(() => ({}))
  const csv: string = typeof body?.csv === 'string' ? body.csv : ''
  const previewOnly = body?.preview === true
  const mode: 'create' | 'upsert' = body?.mode === 'upsert' ? 'upsert' : 'create'
  if (!csv.trim()) return NextResponse.json({ error: 'CSV vacío' }, { status: 400 })

  const { posts, errors: parseErrors } = parseBlogPostsCsv(csv)
  const db = getAdminDb(tenantId)

  const { data: existing } = await db.from('blog_posts').select('id, slug')
  const idBySlug = new Map<string, number>((existing ?? []).map((p: any) => [p.slug, p.id]))

  const skipped: { slug: string; reason: string }[] = []
  const toCreate: typeof posts = []
  const toUpdate: typeof posts = []
  for (const p of posts) {
    if (idBySlug.has(p.slug)) {
      if (mode === 'upsert') toUpdate.push(p)
      else skipped.push({ slug: p.slug, reason: 'Ya existe un artículo con ese slug' })
    } else toCreate.push(p)
  }

  const summary = {
    mode, parsed: posts.length,
    toCreate: toCreate.length, toUpdate: toUpdate.length,
    skipped, parseErrors,
    created: 0, updated: 0,
    errors: [] as { slug: string; message: string }[],
  }

  if (previewOnly) return NextResponse.json({ preview: true, ...summary })

  const fields = (p: typeof posts[number]) => ({
    title: p.title, excerpt: p.excerpt, content: p.content, cover_image: p.cover_image,
    category: p.category, published: p.published, published_at: p.published_at,
    seo_title: p.seo_title, seo_desc: p.seo_desc,
  })

  for (const p of toCreate) {
    const { error } = await db.from('blog_posts').insert({ slug: p.slug, ...fields(p), tenant_id: tenantId })
    if (error) summary.errors.push({ slug: p.slug, message: error.message })
    else summary.created++
  }
  for (const p of toUpdate) {
    const { error } = await db.from('blog_posts').update(fields(p)).eq('id', idBySlug.get(p.slug)!)
    if (error) summary.errors.push({ slug: p.slug, message: error.message })
    else summary.updated++
  }

  return NextResponse.json(summary, { status: 201 })
}
