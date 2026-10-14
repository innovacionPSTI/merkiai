import { productsToCsv, type ExportProduct } from '@merkiai/database'
import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { userCanManageData } from '@/lib/roles'

/**
 * GET → exporta el catálogo del tenant a CSV (HU-130). El formato coincide con
 * el importador (HU-124): una fila por variante, agrupadas por `slug`. Acotado
 * por tenant vía RLS (getAdminDb). HU-134: operación de datos → gated por rol.
 */
export async function GET() {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!userCanManageData(adminUser)) return NextResponse.json({ error: 'Permisos insuficientes para exportar datos' }, { status: 403 })

  const supabase = getAdminDb(adminUser.tenantId)
  const { data, error } = await supabase
    .from('products')
    .select('slug, name, description, featured, active, seo_title, seo_desc, images, variant_options, category:categories(name), variants:product_variants(*)')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const products: ExportProduct[] = (data ?? []).map((p: any) => ({
    slug: p.slug,
    name: p.name,
    description: p.description,
    category: p.category?.name ?? null,
    featured: p.featured,
    active: p.active,
    seo_title: p.seo_title,
    seo_desc: p.seo_desc,
    images: p.images,
    variant_options: p.variant_options ?? [],
    variants: (p.variants ?? [])
      .slice()
      .sort((a: any, b: any) => (a.id ?? 0) - (b.id ?? 0))
      .map((v: any) => ({
        price: v.price,
        compare_at_price: v.compare_at_price,
        stock: v.stock,
        sku: v.sku,
        image_url: v.image_url,
        active: v.active,
        attributes: v.attributes,
        weight_kg: v.weight_kg,
        length_cm: v.length_cm,
        width_cm: v.width_cm,
        height_cm: v.height_cm,
      })),
  }))

  const csv = productsToCsv(products)
  const date = new Date().toISOString().slice(0, 10)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="productos-${date}.csv"`,
    },
  })
}
