import { getProductsPage, getCatalogFacets, getTemplateVariant, getVariantTypes, buildSwatchColorMap } from '@merkiai/database'
import ShopClient from '@/components/shop/ShopClient'
import { getRequestCatalogDb } from '@/lib/tenant-db'
import { requireStoreContext } from '@/lib/store-context'
import { parseShopUrl } from '@/lib/shop-filters'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tienda',
  description: 'Explora nuestra selección de productos.',
}

// E17/HU-157 + HU-270: catálogo del tenant resuelto por Host, paginado en BD.
export const dynamic = 'force-dynamic'

const PAGE_SIZE = 12

export default async function TiendaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const state = parseShopUrl(sp)
  const db = await getRequestCatalogDb()

  // HU-270: búsqueda/filtros/orden/paginación resueltos en BD + facetas aparte.
  const [pageResult, facets, ctx, variantTypes] = await Promise.all([
    getProductsPage(db, {
      search: state.q,
      categoryId: state.categoria,
      attrs: state.attrs,
      sort: state.orden,
      limit: PAGE_SIZE,
      offset: (state.page - 1) * PAGE_SIZE,
    }).catch(() => ({ products: [], total: 0 })),
    getCatalogFacets(db).catch(() => ({ categories: [], attrFilters: [] })),
    requireStoreContext().catch(() => null),
    getVariantTypes(true, db).catch(() => []),
  ])

  const gridVariant = getTemplateVariant(ctx?.template, 'product_grid')
  const colorMap = buildSwatchColorMap(variantTypes)

  return (
    <ShopClient
      products={pageResult.products}
      total={pageResult.total}
      pageSize={PAGE_SIZE}
      facets={facets}
      state={state}
      gridVariant={gridVariant}
      colorMap={colorMap}
    />
  )
}
