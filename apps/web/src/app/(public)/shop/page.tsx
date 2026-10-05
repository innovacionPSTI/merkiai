import { getProducts, getTemplateVariant, getVariantTypes, buildSwatchColorMap } from '@merkiai/database'
import ShopClient from '@/components/shop/ShopClient'
import { getRequestCatalogDb } from '@/lib/tenant-db'
import { requireStoreContext } from '@/lib/store-context'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tienda',
  description: 'Explora nuestra selección de productos.',
}

// E17/HU-157: catálogo del tenant resuelto por Host → render dinámico.
export const dynamic = 'force-dynamic'

export default async function TiendaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const db = await getRequestCatalogDb()
  const [products, sp, ctx, variantTypes] = await Promise.all([
    // E17/HU-156+157: lectura tenant-scoped vía RLS (rol anon + JWT tenant_id),
    // con el tenant resuelto desde el Host de la petición.
    getProducts(undefined, db).catch(() => []),
    searchParams,
    requireStoreContext().catch(() => null),
    getVariantTypes(true, db).catch(() => []),
  ])
  // HU-122a: densidad de la grilla según la plantilla activa (HU-121: tema→layout).
  const gridVariant = getTemplateVariant(ctx?.template, 'product_grid')
  // HU-264: mapa de colores de swatch definido por la tienda.
  const colorMap = buildSwatchColorMap(variantTypes)
  return <ShopClient products={products} searchParams={sp} gridVariant={gridVariant} colorMap={colorMap} />
}
