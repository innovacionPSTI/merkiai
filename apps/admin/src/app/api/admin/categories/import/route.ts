import { parseCategoriesCsv, CATEGORY_IMPORT_TEMPLATE } from '@merkiai/database'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'

/** GET → plantilla CSV de categorías. */
export async function GET() {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  return new NextResponse(CATEGORY_IMPORT_TEMPLATE, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="plantilla-categorias.csv"',
    },
  })
}

/**
 * POST → importa categorías por CSV (HU-132). Reusa el motor de parseo; la
 * jerarquía (`parent_slug`) se resuelve a `parent_id` en una segunda pasada
 * (contra las categorías del archivo + las ya existentes). Acotado por tenant
 * vía RLS. Body: { csv, mode?: 'create'|'upsert', preview?: boolean }.
 */
export async function POST(req: NextRequest) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const tenantId = adminUser.tenantId

  const body = await req.json().catch(() => ({}))
  const csv: string = typeof body?.csv === 'string' ? body.csv : ''
  const previewOnly = body?.preview === true
  const mode: 'create' | 'upsert' = body?.mode === 'upsert' ? 'upsert' : 'create'
  if (!csv.trim()) return NextResponse.json({ error: 'CSV vacío' }, { status: 400 })

  const { categories, errors: parseErrors } = parseCategoriesCsv(csv)
  const supabase = getAdminDb(tenantId)

  const { data: existing } = await supabase.from('categories').select('id, slug')
  const idBySlug = new Map<string, number>((existing ?? []).map((c: any) => [c.slug, c.id]))

  const skipped: { slug: string; reason: string }[] = []
  const toCreate: typeof categories = []
  const toUpdate: typeof categories = []
  for (const c of categories) {
    if (idBySlug.has(c.slug)) {
      if (mode === 'upsert') toUpdate.push(c)
      else skipped.push({ slug: c.slug, reason: 'Ya existe una categoría con ese slug' })
    } else toCreate.push(c)
  }

  const summary = {
    mode,
    parsed: categories.length,
    toCreate: toCreate.length,
    toUpdate: toUpdate.length,
    skipped,
    parseErrors,
    created: 0,
    updated: 0,
    errors: [] as { slug: string; message: string }[],
  }

  if (previewOnly) return NextResponse.json({ preview: true, ...summary })

  const fields = (c: typeof categories[number]) => ({
    name: c.name,
    description: c.description,
    meta_title: c.meta_title,
    meta_description: c.meta_description,
    image_url: c.image_url,
    active: c.active,
    ...(c.order_index != null ? { order_index: c.order_index } : {}),
  })

  // 1ª pasada: crear/actualizar (sin parent todavía).
  for (const c of toCreate) {
    const { data, error } = await supabase
      .from('categories')
      .insert({ slug: c.slug, ...fields(c), tenant_id: tenantId })
      .select('id').single()
    if (error || !data) { summary.errors.push({ slug: c.slug, message: error?.message ?? 'Error al crear' }); continue }
    idBySlug.set(c.slug, data.id)
    summary.created++
  }
  for (const c of toUpdate) {
    const id = idBySlug.get(c.slug)!
    const { error } = await supabase.from('categories').update(fields(c)).eq('id', id)
    if (error) { summary.errors.push({ slug: c.slug, message: error.message }); continue }
    summary.updated++
  }

  // 2ª pasada: resuelve la jerarquía (parent_slug → parent_id).
  for (const c of [...toCreate, ...toUpdate]) {
    const id = idBySlug.get(c.slug)
    if (!id) continue
    const parentId = c.parent_slug ? idBySlug.get(c.parent_slug) : null
    if (c.parent_slug && !parentId) {
      summary.errors.push({ slug: c.slug, message: `Categoría madre "${c.parent_slug}" no encontrada` })
      continue
    }
    if (parentId === id) continue // nunca autoreferencia
    await supabase.from('categories').update({ parent_id: parentId ?? null }).eq('id', id)
  }

  return NextResponse.json(summary, { status: 201 })
}
