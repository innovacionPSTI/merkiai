import { productsToCsv, objectsToCsv, type ExportProduct } from '@merkiai/database'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { canAccess } from '@/lib/roles'

/**
 * GET → respaldo de datos de negocio por dominio (HU-125).
 *   ?domain=products|orders|customers  &format=csv|json
 * Acotado por tenant vía RLS (getAdminDb) y gated por rol (configuración).
 * Los datos sensibles nunca salen del servidor salvo en la descarga del operador.
 */
const DOMAINS = ['products', 'orders', 'customers'] as const
type Domain = typeof DOMAINS[number]

export async function GET(req: NextRequest) {
  const user = await getAdminUser()
  if (!user || !canAccess(user.role, 'configuracion')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const domain = (req.nextUrl.searchParams.get('domain') ?? '') as Domain
  const format = req.nextUrl.searchParams.get('format') === 'json' ? 'json' : 'csv'
  if (!DOMAINS.includes(domain)) {
    return NextResponse.json({ error: 'Dominio inválido (products|orders|customers)' }, { status: 400 })
  }

  const supabase = getAdminDb(user.tenantId)
  const date = new Date().toISOString().slice(0, 10)

  let csv = ''
  let json: unknown = null

  if (domain === 'products') {
    const { data } = await supabase
      .from('products')
      .select('slug, name, description, featured, active, seo_title, seo_desc, images, variant_options, category:categories(name), variants:product_variants(*)')
      .order('created_at', { ascending: true })
    json = data ?? []
    const products: ExportProduct[] = (data ?? []).map((p: any) => ({
      slug: p.slug, name: p.name, description: p.description, category: p.category?.name ?? null,
      featured: p.featured, active: p.active, seo_title: p.seo_title, seo_desc: p.seo_desc,
      images: p.images, variant_options: p.variant_options ?? [],
      variants: (p.variants ?? []).slice().sort((a: any, b: any) => (a.id ?? 0) - (b.id ?? 0)).map((v: any) => ({
        price: v.price, compare_at_price: v.compare_at_price, stock: v.stock, sku: v.sku,
        image_url: v.image_url, active: v.active, attributes: v.attributes,
        weight_kg: v.weight_kg, length_cm: v.length_cm, width_cm: v.width_cm, height_cm: v.height_cm,
      })),
    }))
    csv = productsToCsv(products)
  }

  if (domain === 'orders') {
    const { data } = await supabase
      .from('orders')
      .select('order_number, created_at, status, payment_status, payment_method, customer_name, customer_email, customer_phone, shipping_addr, subtotal, shipping_cost, discount, total, coupon_code, tracking_number, carrier_name, items')
      .order('created_at', { ascending: false })
    json = data ?? []
    const headers = [
      'order_number', 'created_at', 'status', 'payment_status', 'payment_method',
      'customer_name', 'customer_email', 'customer_phone',
      'shipping_department', 'shipping_city', 'shipping_address',
      'subtotal', 'shipping_cost', 'discount', 'total', 'coupon_code',
      'tracking_number', 'carrier_name', 'items',
    ]
    const rows = (data ?? []).map((o: any) => {
      const a = (o.shipping_addr ?? {}) as Record<string, string>
      return {
        ...o,
        shipping_department: a.department ?? '',
        shipping_city: a.city ?? '',
        shipping_address: a.address ?? '',
      }
    })
    csv = objectsToCsv(headers, rows)
  }

  if (domain === 'customers') {
    const { data } = await supabase
      .from('customers')
      .select('id, name, email, phone, created_at')
      .order('created_at', { ascending: false })
    json = data ?? []
    csv = objectsToCsv(['id', 'name', 'email', 'phone', 'created_at'], data ?? [])
  }

  if (format === 'json') {
    return new NextResponse(JSON.stringify(json, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="respaldo-${domain}-${date}.json"`,
      },
    })
  }

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="respaldo-${domain}-${date}.csv"`,
    },
  })
}
