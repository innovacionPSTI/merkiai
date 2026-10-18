import type { Database } from '@merkiai/database'
import { NextRequest, NextResponse } from 'next/server'
import { resolveEmailConfig, notifyBackInStock, suggestRedirectOnSlugChange } from '@merkiai/database'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'

type ProductUpdate = Database['public']['Tables']['products']['Update']
type VariantUpsert = Database['public']['Tables']['product_variants']['Insert']

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const supabase = getAdminDb(adminUser.tenantId)
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*), variants:product_variants(*)')
    .eq('id', Number(id))
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json()
  const { variants } = body

  // Whitelist de columnas del producto: nunca se hace spread del body porque el
  // form del admin incluye campos solo-UI (selectedTypeIds, category, created_at,
  // min_price/max_price, …) que no son columnas y hacen fallar el update
  // ("Could not find the 'X' column of 'products'"). tenant_id tampoco se acepta
  // del cliente (RLS lo protege). Se omite cada campo que no venga en el body.
  const productData: ProductUpdate = {}
  if ('name' in body)            productData.name = String(body.name ?? '').trim()
  if ('slug' in body)            productData.slug = String(body.slug ?? '').trim()
  if ('description' in body)     productData.description = body.description || null
  if ('category_id' in body)     productData.category_id = body.category_id ? Number(body.category_id) : null
  if ('featured' in body)        productData.featured = !!body.featured
  if ('active' in body)          productData.active = !!body.active
  if ('allow_backorder' in body) productData.allow_backorder = !!body.allow_backorder
  if ('seo_title' in body)       productData.seo_title = body.seo_title || null
  if ('seo_desc' in body)        productData.seo_desc = body.seo_desc || null
  if ('images' in body)          productData.images = Array.isArray(body.images) ? body.images : []
  if ('variant_options' in body) productData.variant_options = Array.isArray(body.variant_options) && body.variant_options.length > 0 ? body.variant_options : null

  const supabase = getAdminDb(adminUser.tenantId)

  // HU-113 (AC-3): si cambia el slug, se auto-sugiere un redirect 301 de la URL
  // vieja a la nueva. Se lee el slug previo antes del update.
  let prevSlug: string | null = null
  if ('slug' in body) {
    const { data: before } = await supabase.from('products').select('slug').eq('id', Number(id)).single()
    prevSlug = (before?.slug as string) ?? null
  }

  // Actualizar datos del producto
  const { data: product, error: productError } = await supabase
    .from('products')
    .update(productData)
    .eq('id', Number(id))
    .select()
    .single()
  if (productError) return NextResponse.json({ error: productError.message }, { status: 500 })

  // HU-113: alta best-effort del redirect tras confirmar el cambio de slug.
  if (prevSlug && product?.slug && prevSlug !== product.slug) {
    await suggestRedirectOnSlugChange(`/shop/${prevSlug}`, `/shop/${product.slug}`, supabase, adminUser.tenantId)
  }

  // Sincronizar variantes si se enviaron
  if (variants) {
    // Eliminar las que tienen _delete: true
    const toDelete = variants.filter((v: any) => v._delete && v.id)
    for (const v of toDelete) {
      await supabase.from('product_variants').delete().eq('id', v.id)
    }

    // HU-105: stock ANTES del upsert, para detectar reposición (0 → >0) por
    // variante existente y avisar a los suscriptores de "avísame cuando vuelva".
    const existingIds = variants.filter((v: any) => !v._delete && v.id).map((v: any) => Number(v.id))
    const prevStock = new Map<number, number>()
    if (existingIds.length > 0) {
      const { data: prev } = await supabase
        .from('product_variants')
        .select('id, stock')
        .in('id', existingIds)
      for (const r of prev ?? []) prevStock.set(r.id as number, Number(r.stock ?? 0))
    }

    // Upsert el resto
    const toUpsert: VariantUpsert[] = variants
      .filter((v: any) => !v._delete)
      .map((v: any) => ({
        ...(v.id ? { id: v.id } : {}),
        product_id: Number(id),
        tenant_id: adminUser.tenantId,
        weight: (v.weight || null) as VariantUpsert['weight'],
        price: Number(v.price),
        compare_at_price: v.compare_at_price != null && v.compare_at_price !== '' ? Number(v.compare_at_price) : null,
        image_url: v.image_url || null,
        stock: Number(v.stock ?? 0),
        sku: v.sku || null,
        active: v.active ?? true,
        weight_kg: v.weight_kg ? Number(v.weight_kg) : null,
        length_cm: v.length_cm ? Number(v.length_cm) : null,
        width_cm:  v.width_cm  ? Number(v.width_cm)  : null,
        height_cm: v.height_cm ? Number(v.height_cm) : null,
        attributes: v.attributes && Object.keys(v.attributes).length > 0 ? v.attributes : null,
      }))

    if (toUpsert.length > 0) {
      const { error: variantError } = await supabase
        .from('product_variants')
        .upsert(toUpsert, { onConflict: 'id' })
      if (variantError) return NextResponse.json({ error: variantError.message }, { status: 500 })
    }

    // HU-105: variantes que pasaron de agotadas (≤0) a con stock (>0) → avisar a
    // los suscriptores pendientes (idempotente). Se AWAITea (serverless) pero no
    // tumba la respuesta si el correo falla.
    const replenished = variants.filter((v: any) => {
      if (v._delete || !v.id) return false
      const before = prevStock.get(Number(v.id)) ?? 0
      const after = Number(v.stock ?? 0)
      return before <= 0 && after > 0
    })
    if (replenished.length > 0) {
      const ec = await resolveEmailConfig(supabase, adminUser.tenantId).catch(() => null)
      if (ec) {
        const emailConfig = { apiKey: ec.apiKey, fromEmail: ec.fromEmail, storeName: ec.storeName, emailProvider: ec.provider }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const options: string[] = Array.isArray((product as any).variant_options) ? (product as any).variant_options : []
        for (const v of replenished) {
          const attrs = (v.attributes ?? {}) as Record<string, string>
          const variantLabel = options.map((o) => attrs[o]).filter(Boolean).join(' · ') || null
          await notifyBackInStock(
            supabase,
            Number(v.id),
            { productName: product.name, productUrl: null, variantLabel },
            emailConfig,
          ).catch((e) => console.error('[products PATCH] back-in-stock:', e instanceof Error ? e.message : e))
        }
      }
    }
  }

  return NextResponse.json(product)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const supabase = getAdminDb(adminUser.tenantId)

  // Eliminar variantes primero (FK)
  await supabase.from('product_variants').delete().eq('product_id', Number(id))

  const { error } = await supabase.from('products').delete().eq('id', Number(id))
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
