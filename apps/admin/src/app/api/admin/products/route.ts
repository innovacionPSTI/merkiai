import type { Database } from '@merkiai/database'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantEntitlements, withinLimit } from '@/lib/entitlements'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'

type VariantInsert = Database['public']['Tables']['product_variants']['Insert']

export async function POST(req: NextRequest) {
  // HU-158 Etapa 2: cliente RLS del admin acotado al tenant que administra
  // (getAdminUser().tenantId), NO service-role.
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const tenantId = adminUser.tenantId

  const body = await req.json()
  const { name, slug, description, category_id, featured, active, allow_backorder, seo_title, seo_desc, images = [], variants = [], variant_options = [] } = body

  if (!name?.trim() || !slug?.trim())
    return NextResponse.json({ error: 'Nombre y slug son requeridos' }, { status: 400 })
  if (variants.length === 0)
    return NextResponse.json({ error: 'El producto debe tener al menos una variante' }, { status: 400 })

  const supabase = getAdminDb(tenantId)

  // HU-173: límite de productos por plan. Regla de negocio: si el control plane
  // no está configurado (sin entitlements), no bloquea.
  const { entitlements } = await getTenantEntitlements(tenantId)
  if (entitlements) {
    const { count } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
    if (!withinLimit(entitlements, 'products', count ?? 0)) {
      return NextResponse.json(
        { error: 'Límite de productos del plan alcanzado. Actualiza el plan para agregar más.' },
        { status: 403 },
      )
    }
  }

  // Crear producto
  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({
      name: name.trim(),
      slug: slug.trim(),
      description: description || null,
      category_id: category_id || null,
      featured: featured ?? false,
      active: active ?? true,
      allow_backorder: allow_backorder ?? false,
      seo_title: seo_title || null,
      seo_desc: seo_desc || null,
      images: Array.isArray(images) ? images : [],
      variant_options: Array.isArray(variant_options) && variant_options.length > 0 ? variant_options : null,
      tenant_id: tenantId,
    })
    .select()
    .single()

  if (productError) return NextResponse.json({ error: productError.message }, { status: 500 })

  // Crear variantes
  const variantRows: VariantInsert[] = variants.map((v: any) => ({
    product_id: product.id,
    tenant_id: tenantId,
    roast: (v.roast || null) as VariantInsert['roast'],
    weight: (v.weight || null) as VariantInsert['weight'],
    grind: (v.grind || null) as VariantInsert['grind'],
    brew_method: (v.brew_method || null) as VariantInsert['brew_method'],
    price: Number(v.price),
    stock: Number(v.stock ?? 0),
    sku: v.sku || null,
    active: v.active ?? true,
    weight_kg: v.weight_kg ? Number(v.weight_kg) : null,
    length_cm: v.length_cm ? Number(v.length_cm) : null,
    width_cm:  v.width_cm  ? Number(v.width_cm)  : null,
    height_cm: v.height_cm ? Number(v.height_cm) : null,
    attributes: v.attributes && Object.keys(v.attributes).length > 0 ? v.attributes : null,
  }))

  const { error: variantError } = await supabase.from('product_variants').insert(variantRows)
  if (variantError) return NextResponse.json({ error: variantError.message }, { status: 500 })

  return NextResponse.json(product, { status: 201 })
}
