import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader, Icon } from '@merkiai/ui'
import ProductosSearch from './ProductosSearch'
import ImportProductsModal from './ImportProductsModal'
import ProductsTable from './ProductsTable'
import { getStoreConfig } from '@merkiai/database'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { userCanManageData } from '@/lib/roles'

export const metadata: Metadata = { title: 'Productos' }
export const dynamic = 'force-dynamic'

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const sp = await searchParams
  const q = sp.q?.trim() ?? ''
  const stockFilter = sp.stock === 'bajo'

  // HU-158 Etapa 2/3: cliente RLS acotado al tenant del admin (antes: service-role
  // sin filtro → mostraba productos de TODOS los tenants).
  const adminUser = await getAdminUser()
  if (!adminUser) redirect('/no-autorizado')
  const supabase = getAdminDb(adminUser.tenantId)
  let query = supabase
    .from('products')
    .select('*, variants:product_variants(*), category:categories(name)')
    .order('created_at', { ascending: false })

  if (q) {
    query = query.ilike('name', `%${q}%`)
  }

  const { data: products } = await query

  // HU-106 · umbral de stock bajo configurable + filtro opcional "stock=bajo".
  const lowStockThreshold = (await getStoreConfig(supabase, adminUser.tenantId)).low_stock_threshold
  const isLow = (p: any): boolean =>
    !p.allow_backorder &&
    (p.variants ?? []).some((v: any) => v.active !== false && (v.stock ?? 0) <= lowStockThreshold)
  const visibleProducts = stockFilter ? (products ?? []).filter(isLow) : (products ?? [])

  // HU-131 · categorías para la acción masiva "cambiar categoría".
  const { data: categories } = await supabase.from('categories').select('id, name').order('name')

  return (
    <div>
      <div className="mb-8">
        <PageHeader
          title="Productos"
          description="Administra el catálogo de productos de tu tienda."
          action={
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* HU-134 · exportar/importar solo para roles con permiso de datos */}
              {userCanManageData(adminUser) && (
                <>
                  <a
                    href="/api/admin/products/export"
                    className="border border-brand-primary/20 text-brand-primary rounded-full px-5 py-2 font-brand text-sm hover:bg-brand-cream transition-colors inline-flex items-center gap-2"
                  >
                    <Icon name="external" size={16} /> Exportar CSV
                  </a>
                  <ImportProductsModal />
                </>
              )}
              <Link
                href="/productos/nuevo"
                className="bg-brand-primary text-brand-cream rounded-full px-5 py-2 font-brand text-sm hover:bg-brand-dark transition-colors inline-flex items-center gap-2"
              >
                <Icon name="plus" size={16} /> Nuevo producto
              </Link>
            </div>
          }
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
          <ProductosSearch defaultQ={q} />
          <Link
            href={stockFilter ? (q ? `/productos?q=${encodeURIComponent(q)}` : '/productos') : (q ? `/productos?q=${encodeURIComponent(q)}&stock=bajo` : '/productos?stock=bajo')}
            className={`font-brand text-sm rounded-full px-4 py-2 inline-flex items-center gap-2 transition-colors ${
              stockFilter
                ? 'bg-brand-primary text-brand-cream'
                : 'border border-brand-primary/20 text-brand-primary hover:bg-brand-cream'
            }`}
          >
            <Icon name="alert" size={15} /> Stock bajo
          </Link>
        </div>

        <ProductsTable
          products={visibleProducts}
          categories={categories ?? []}
          emptyQ={stockFilter ? 'stock bajo' : (q || undefined)}
          lowStockThreshold={lowStockThreshold}
        />
      </div>
    </div>
  )
}
