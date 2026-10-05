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

  // Slugs existentes (para omitir duplicados) y conteo actual (para el tope).
  const { data: existing } = await supabase.from('products').select('slug')
  const existingSlugs = new Set((existing ?? []).map((p) => p.slug))
  const currentCount = existing?.length ?? 0

  // Tope de plan (regla de negocio; si no hay control plane → sin límite).
  const { entitlements } = await getTenantEntitlements(tenantId)
  const max = resolveLimit(entitlements, LIMITS.PRODUCTS)
  const remaining = max === null ? Infinity : Math.max(0, max - currentCount)

  // Categorías del tenant: nombre (minúsculas) → id.
  const { data: cats } = await supabase.from('categories').select('id, name')
  const catByName = new Map((cats ?? []).map((c) => [c.name.trim().toLowerCase(), c.id]))

  // Clasifica qué se crearía, se omite o entra en conflicto — antes de escribir.
  const skipped: { slug: string; reason: string }[] = []
  const toCreate: typeof products = []
  const seenInFile = new Set<string>()

  for (const p of products) {
    if (seenInFile.has(p.slug)) continue  // (no debería: el parser agrupa)
    seenInFile.add(p.slug)
    if (existingSlugs.has(p.slug)) { skipped.push({ slug: p.slug, reason: 'Ya existe un producto con ese slug' }); continue }
    if (toCreate.length >= remaining) { skipped.push({ slug: p.slug, reason: 'Supera el tope de productos de tu plan' }); continue }
    toCreate.push(p)
  }

  const summary = {
    parsed: products.length,
    toCreate: toCreate.length,
    skipped,
    parseErrors,
    created: 0 as number,
    createErrors: [] as { slug: string; message: string }[],
  }

  // Modo previsualización: no escribe, solo reporta qué pasaría.
  if (previewOnly) return NextResponse.json({ preview: true, ...summary })

  // Inserción (producto + variantes) por cada uno, acotado por RLS.
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

    const variantRows: VariantInsert[] = p.variants.map((v) => ({
      product_id: product.id,
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
    }))

    const { error: variantError } = await supabase.from('product_variants').insert(variantRows)
    if (variantError) {
      // El producto quedó sin variantes útiles: lo revertimos para no dejar basura.
      await supabase.from('products').delete().eq('id', product.id)
      summary.createErrors.push({ slug: p.slug, message: variantError.message })
      continue
    }

    summary.created++
  }

  return NextResponse.json(summary, { status: 201 })
}
