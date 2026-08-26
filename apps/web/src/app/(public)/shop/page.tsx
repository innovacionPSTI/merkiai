import { getProducts } from '@merkiai/database'
import ShopClient from '@/components/shop/ShopClient'
import { getTenantDb } from '@/lib/tenant-db'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tienda',
  description: 'Explora nuestra selección de productos.',
}

export const revalidate = 60

export default async function TiendaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [products, sp] = await Promise.all([
    // E17/HU-156: lectura tenant-scoped vía RLS (rol anon + JWT tenant_id).
    getProducts(undefined, getTenantDb()).catch(() => []),
    searchParams,
  ])
  return <ShopClient products={products} searchParams={sp} />
}
