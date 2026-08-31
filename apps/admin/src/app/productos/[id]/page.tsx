import { getVariantTypes } from '@merkiai/database'
import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import ProductForm from '../ProductForm'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const adminUser = await getAdminUser()
  if (!adminUser) return { title: 'Producto' }
  const supabase = getAdminDb(adminUser.tenantId)
  const { data } = await supabase.from('products').select('name').eq('id', Number(id)).single()
  return { title: data ? `Editar: ${data.name}` : 'Producto' }
}

export default async function EditarProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // HU-158 Etapa 2/3: cliente RLS del tenant (antes: service-role sin filtro).
  const adminUser = await getAdminUser()
  if (!adminUser) redirect('/no-autorizado')
  const supabase = getAdminDb(adminUser.tenantId)

  const [{ data: product }, { data: categories }, variantTypes] = await Promise.all([
    supabase
      .from('products')
      .select('*, variants:product_variants(*)')
      .eq('id', Number(id))
      .single(),
    supabase
      .from('categories')
      .select('id, name')
      .eq('active', true)
      .order('name'),
    getVariantTypes(true, supabase),
  ])

  if (!product) notFound()

  return (
    <div>
      <ProductForm product={product} categories={categories ?? []} variantTypes={variantTypes} />
    </div>
  )
}
