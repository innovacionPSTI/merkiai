import { getProducts, getTemplateVariant } from '@merkiai/database'
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
  const [products, sp, ctx] = await Promise.all([
    // E17/HU-156+157: lectura tenant-scoped vía RLS (rol anon + JWT tenant_id),
    // con el tenant resuelto desde el Host de la petición.
    getProducts(undefined, await getRequestCatalogDb()).catch(() => []),
    searchParams,
    requireStoreContext().catch(() => null),
  ])
  // HU-122a: densidad de la grilla según la plantilla activa de la tienda.
  const gridVariant = getTemplateVariant(ctx?.config?.template, 'product_grid')
  return <ShopClient products={products} searchParams={sp} gridVariant={gridVariant} />
}
