import type { Database } from '@merkiai/database'
import { parseProductsCsv, PRODUCT_IMPORT_TEMPLATE } from '@merkiai/database'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantEntitlements, resolveLimit, LIMITS } from '@/lib/entitlements'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'

type VariantInsert = Database['public']['Tables']['product_variants']['Insert']

/** GET → descarga la plantilla CSV de ejemplo. */
export async function GET() {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  return new NextResponse(PRODUCT_IMPORT_TEMPLATE, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="plantilla-productos.csv"',
    },
  })
}

/**
 * POST → importa productos desde CSV (HU-124). Una fila = una variante;
 * filas con el mismo slug forman un producto. Acotado por tenant vía RLS
 * (getAdminDb), respeta el tope de productos del plan y omite slugs existentes.
 * Body: { csv: string } o { preview: true, csv } para solo validar.
 */
export async function POST(req: NextRequest) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const tenantId = adminUser.tenantId

  const body = await req.json().catch(() => ({}))
  const csv: string = typeof body?.csv === 'string' ? body.csv : ''
  const previewOnly = body?.preview === true
  if (!csv.trim()) return NextResponse.json({ error: 'CSV vacío' }, { status: 400 })

  const { products, errors: parseErrors } = parseProductsCsv(csv)

  const supabase = getAdminDb(tenantId)

  // HU-124 v2 · modo: 'create' (omite existentes) o 'upsert' (actualiza existentes).
  const mode: 'create' | 'upsert' = body?.mode === 'upsert' ? 'upsert' : 'create'

  // Productos existentes del tenant con sus variantes (para omitir o actualizar).
  const { data: existing } = await supabase
    .from('products')
    .select('id, slug, variants:product_variants(id, sku, attributes)')
  const existingBySlug = new Map((existing ?? []).map((p: any) => [p.slug, p]))
  const currentCount = existing?.length ?? 0

  // Tope de plan (regla de negocio; si no hay control plane → sin límite).
  // Solo los productos NUEVOS cuentan contra el tope; actualizar no suma.
  const { entitlements } = await getTenantEntitlements(tenantId)
  const max = resolveLimit(entitlements, LIMITS.PRODUCTS)
  const remaining = max === null ? Infinity : Math.max(0, max - currentCount)

  // Categorías del tenant: nombre (minúsculas) → id.
  const { data: cats } = await supabase.from('categories').select('id, name')
  const catByName = new Map((cats ?? []).map((c) => [c.name.trim().toLowerCase(), c.id]))

  // Clasifica qué se crearía, actualizaría u omitiría — antes de escribir.
  const skipped: { slug: string; reason: string }[] = []
  const toCreate: typeof products = []
  const toUpdate: typeof products = []
  const seenInFile = new Set<string>()

  for (const p of products) {
    if (seenInFile.has(p.slug)) continue  // (no debería: el parser agrupa)
    seenInFile.add(p.slug)
    if (existingBySlug.has(p.slug)) {
      if (mode === 'upsert') toUpdate.push(p)
      else skipped.push({ slug: p.slug, reason: 'Ya existe un producto con ese slug' })
      continue
    }
    if (toCreate.length >= remaining) { skipped.push({ slug: p.slug, reason: 'Supera el tope de productos de tu plan' }); continue }
    toCreate.push(p)
  }

  const summary = {
    mode,
    parsed: products.length,
    toCreate: toCreate.length,
    toUpdate: toUpdate.length,
    skipped,
    parseErrors,
    created: 0 as number,
    updated: 0 as number,
    createErrors: [] as { slug: string; message: string }[],
    updateErrors: [] as { slug: string; message: string }[],
  }

  // Modo previsualización: no escribe, solo reporta qué pasaría.
  if (previewOnly) return NextResponse.json({ preview: true, ...summary })

  const toVariantRow = (v: typeof products[number]['variants'][number], productId: number): VariantInsert => ({
    product_id: productId,
    tenant_id: tenantId,
    price: v.price,
    compare_at_price: v.compare_at_price,
    image_url: v.image_url,
    stock: v.stock,
    sku: v.sku,
    active: v.active,
    weight_kg: v.weight_kg,
    length_cm: v.length_cm,
    width_cm: v.width_cm,
    height_cm: v.height_cm,
    attributes: v.attributes,
  })

  // ── Crear productos nuevos (producto + variantes) ──────────────────────────
  for (const p of toCreate) {
    const category_id = p.category ? (catByName.get(p.category.toLowerCase()) ?? null) : null

    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        name: p.name,
        slug: p.slug,
        description: p.description,
        category_id,
        featured: p.featured,
        active: p.active,
        seo_title: p.seo_title,
        seo_desc: p.seo_desc,
        images: p.images.map((url, i) => ({ url, alt: p.name, order: i })),
        variant_options: p.variant_options.length > 0 ? p.variant_options : null,
        tenant_id: tenantId,
      })
      .select()
      .single()

    if (productError || !product) {
      summary.createErrors.push({ slug: p.slug, message: productError?.message ?? 'Error al crear el producto' })
      continue
    }

    const { error: variantError } = await supabase
      .from('product_variants')
      .insert(p.variants.map((v) => toVariantRow(v, product.id)))
    if (variantError) {
      // El producto quedó sin variantes útiles: lo revertimos para no dejar basura.
      await supabase.from('products').delete().eq('id', product.id)
      summary.createErrors.push({ slug: p.slug, message: variantError.message })
      continue
    }

    summary.created++
  }

  // ── Actualizar productos existentes (upsert de campos + variantes) ─────────
  for (const p of toUpdate) {
    const current = existingBySlug.get(p.slug)
    const category_id = p.category ? (catByName.get(p.category.toLowerCase()) ?? null) : null

    const { error: updErr } = await supabase
      .from('products')
      .update({
        name: p.name,
        description: p.description,
        category_id,
        featured: p.featured,
        active: p.active,
        seo_title: p.seo_title,
        seo_desc: p.seo_desc,
        images: p.images.map((url, i) => ({ url, alt: p.name, order: i })),
        variant_options: p.variant_options.length > 0 ? p.variant_options : null,
      })
      .eq('id', current.id)

    if (updErr) { summary.updateErrors.push({ slug: p.slug, message: updErr.message }); continue }

    // Empareja variantes del CSV con las existentes por SKU y, si no, por atributos.
    const pool: { id: number; sku: string | null; attributes: Record<string, string> | null }[] =
      (current.variants ?? []).map((v: any) => ({ id: v.id, sku: v.sku, attributes: v.attributes }))
    const attrKey = (a: Record<string, string> | null | undefined) =>
      a ? JSON.stringify(Object.keys(a).sort().map((k) => [k, a[k]])) : ''

    let vErr: string | null = null
    const toInsert: VariantInsert[] = []

    for (const v of p.variants) {
      let mi = v.sku ? pool.findIndex((e) => e.sku && e.sku === v.sku) : -1
      if (mi === -1) mi = pool.findIndex((e) => attrKey(e.attributes) === attrKey(v.attributes))
      if (mi >= 0) {
        const match = pool.splice(mi, 1)[0]
        const { error } = await supabase.from('product_variants')
          .update(toVariantRow(v, current.id)).eq('id', match.id)
        if (error) { vErr = error.message; break }
      } else {
        toInsert.push(toVariantRow(v, current.id))
      }
    }

    if (!vErr && toInsert.length > 0) {
      const { error } = await supabase.from('product_variants').insert(toInsert)
      if (error) vErr = error.message
    }

    if (vErr) { summary.updateErrors.push({ slug: p.slug, message: vErr }); continue }
    summary.updated++
  }

  return NextResponse.json(summary, { status: 201 })
}
