import type { Db } from '../client'

/**
 * Bundles / kits de producto (HU-168). Agrupan varias variantes como una unidad
 * con precio propio. La disponibilidad se deriva del componente más restrictivo
 * y el precio del bundle entra al pipeline. La lógica de disponibilidad/ahorro
 * es pura y testeable; el descuento de stock por componente es Fase 2.
 */

export interface BundleComponent {
  variant_id: number
  qty: number
  /** Datos del componente para mostrar/validar (opcionales según la consulta). */
  stock?: number
  allow_backorder?: boolean
  price?: number
  product_name?: string
  variant_label?: string | null
}

export interface Bundle {
  id: number
  name: string
  slug: string
  description: string | null
  price: number
  image_url: string | null
  active: boolean
  components: BundleComponent[]
}

/**
 * Cuántas unidades del bundle se pueden comprar según el componente más
 * restrictivo (AC-4). Un componente con backorder no limita (Infinity). Pura.
 */
export function bundleMaxQty(components: BundleComponent[]): number {
  if (components.length === 0) return 0
  let max = Infinity
  for (const c of components) {
    if (c.allow_backorder) continue
    const perUnit = Math.max(1, c.qty)
    const canMake = Math.floor((c.stock ?? 0) / perUnit)
    if (canMake < max) max = canMake
  }
  return max === Infinity ? Number.MAX_SAFE_INTEGER : Math.max(0, max)
}

/** ¿El bundle está disponible para comprar al menos 1 unidad? Pura. */
export function isBundleAvailable(components: BundleComponent[]): boolean {
  return bundleMaxQty(components) > 0
}

/** Precio de catálogo del bundle (suma de componentes) para mostrar el ahorro. Pura. */
export function componentsListPrice(components: BundleComponent[]): number {
  return components.reduce((s, c) => s + (c.price ?? 0) * Math.max(1, c.qty), 0)
}

/** Ahorro del bundle vs comprar los componentes sueltos (nunca negativo). Pura. */
export function bundleSavings(bundlePrice: number, components: BundleComponent[]): number {
  return Math.max(0, componentsListPrice(components) - bundlePrice)
}

// ── Capa de datos ─────────────────────────────────────────────────────────────

export async function listBundles(db: Db): Promise<Bundle[]> {
  const { data } = await db
    .from('bundles')
    .select('id, name, slug, description, price, image_url, active, bundle_components(variant_id, qty)')
    .order('created_at', { ascending: false })
  return (data ?? []).map((b: any) => ({
    id: b.id, name: b.name, slug: b.slug, description: b.description, price: b.price,
    image_url: b.image_url, active: b.active,
    components: (b.bundle_components ?? []).map((c: any) => ({ variant_id: c.variant_id, qty: c.qty })),
  }))
}

/** Bundle con los datos de stock/precio de cada componente (storefront/validación). */
export async function getBundleWithComponents(slug: string, db: Db): Promise<Bundle | null> {
  const { data } = await db
    .from('bundles')
    .select('id, name, slug, description, price, image_url, active, bundle_components(variant_id, qty, product_variants!inner(price, stock, products!inner(name, allow_backorder)))')
    .eq('slug', slug)
    .maybeSingle()
  if (!data) return null
  const b = data as any
  const components: BundleComponent[] = (b.bundle_components ?? []).map((c: any) => {
    const v = Array.isArray(c.product_variants) ? c.product_variants[0] : c.product_variants
    const prod = v ? (Array.isArray(v.products) ? v.products[0] : v.products) : null
    return {
      variant_id: c.variant_id, qty: c.qty,
      price: v?.price ?? 0, stock: v?.stock ?? 0,
      allow_backorder: prod?.allow_backorder ?? false,
      product_name: prod?.name ?? null,
    }
  })
  return { id: b.id, name: b.name, slug: b.slug, description: b.description, price: b.price, image_url: b.image_url, active: b.active, components }
}

/**
 * Bundles por id con sus componentes (variant_id, qty) y precio. Para expandir
 * líneas de bundle en el checkout de forma **server-authoritative** (no se
 * confía en los componentes/precio que envía el cliente).
 */
export async function getBundlesByIds(ids: number[], db: Db): Promise<Array<{ id: number; name: string; price: number; components: Array<{ variant_id: number; qty: number }> }>> {
  if (!ids.length) return []
  const { data } = await db
    .from('bundles')
    .select('id, name, price, active, bundle_components(variant_id, qty)')
    .in('id', ids)
    .eq('active', true)
  return (data ?? []).map((b: any) => ({
    id: b.id, name: b.name, price: b.price,
    components: (b.bundle_components ?? []).map((c: any) => ({ variant_id: c.variant_id, qty: c.qty })),
  }))
}

/**
 * Expande líneas de carrito que son bundles a líneas por componente para el
 * stock y el registro de la orden. Pura. Distribuye el precio del bundle entre
 * sus componentes proporcional al precio de lista (resto al primero) para que la
 * suma de líneas = precio del bundle × cantidad. Las líneas normales pasan igual.
 */
export interface CheckoutLineIn { variant_id?: number; qty: number; product_name?: string; variant_label?: string; price?: number; bundle_id?: number }
export interface CheckoutLineOut { variant_id: number; qty: number; product_name: string; variant_label: string; price: number }

export function expandBundleLines(
  lines: CheckoutLineIn[],
  bundles: Map<number, { name: string; price: number; components: Array<{ variant_id: number; qty: number }> }>,
  componentPrice: Map<number, number>,
): CheckoutLineOut[] {
  const out: CheckoutLineOut[] = []
  for (const l of lines) {
    if (l.bundle_id && bundles.has(l.bundle_id)) {
      const b = bundles.get(l.bundle_id)!
      const bundleQty = Math.max(1, Math.floor(l.qty))
      const listTotal = b.components.reduce((s, c) => s + (componentPrice.get(c.variant_id) ?? 0) * c.qty, 0)
      let distributed = 0
      b.components.forEach((c, idx) => {
        const unitList = (componentPrice.get(c.variant_id) ?? 0) * c.qty
        // Precio del componente (por 1 bundle) proporcional al precio de lista.
        let compPrice = listTotal > 0 ? Math.round((b.price * unitList) / listTotal) : Math.round(b.price / b.components.length)
        if (idx === b.components.length - 1) compPrice = b.price - distributed // resto al último
        distributed += compPrice
        out.push({
          variant_id: c.variant_id,
          qty: c.qty * bundleQty,
          product_name: `${b.name}`,
          variant_label: '',
          price: c.qty > 0 ? Math.round(compPrice / c.qty) : compPrice,
        })
      })
    } else if (l.variant_id) {
      out.push({ variant_id: l.variant_id, qty: l.qty, product_name: l.product_name ?? '', variant_label: l.variant_label ?? '', price: l.price ?? 0 })
    }
  }
  return out
}

export interface BundleInput {
  name: string
  slug: string
  description?: string | null
  price: number
  image_url?: string | null
  components: Array<{ variant_id: number; qty: number }>
}

export function validateBundle(input: BundleInput): { ok: boolean; error?: string } {
  if (!(input.name ?? '').trim()) return { ok: false, error: 'El nombre es obligatorio.' }
  if (!(input.slug ?? '').trim()) return { ok: false, error: 'El slug es obligatorio.' }
  if (!(input.price >= 0)) return { ok: false, error: 'El precio debe ser 0 o mayor.' }
  if (!input.components || input.components.length === 0) return { ok: false, error: 'Agrega al menos un componente.' }
  if (input.components.some((c) => !(c.qty >= 1))) return { ok: false, error: 'Cada componente necesita cantidad ≥ 1.' }
  return { ok: true }
}

export async function createBundle(input: BundleInput, db: Db, tenantId: string): Promise<Bundle> {
  const v = validateBundle(input)
  if (!v.ok) throw new Error(v.error)
  const { data, error } = await db
    .from('bundles')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({ tenant_id: tenantId, name: input.name.trim(), slug: input.slug.trim(), description: input.description ?? null, price: Math.round(input.price), image_url: input.image_url ?? null } as any)
    .select('id, name, slug, description, price, image_url, active')
    .single()
  if (error) throw error
  const bundle = data as any
  const rows = input.components.map((c) => ({ tenant_id: tenantId, bundle_id: bundle.id, variant_id: c.variant_id, qty: Math.round(c.qty) }))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: cErr } = await db.from('bundle_components').insert(rows as any)
  if (cErr) throw cErr
  return { ...bundle, components: input.components.map((c) => ({ variant_id: c.variant_id, qty: c.qty })) }
}

export async function setBundleActive(id: number, active: boolean, db: Db): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await db.from('bundles').update({ active, updated_at: new Date().toISOString() } as any).eq('id', id)
  if (error) throw error
}

export async function deleteBundle(id: number, db: Db): Promise<void> {
  const { error } = await db.from('bundles').delete().eq('id', id)
  if (error) throw error
}
