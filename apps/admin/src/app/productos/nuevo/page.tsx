import { getVariantTypes } from '@merkiai/database'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import ProductForm from '../ProductForm'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'

export const metadata: Metadata = { title: 'Nuevo producto' }
export const dynamic = 'force-dynamic'

export default async function NuevoProductoPage() {
  // HU-158: categorías y variant types del TENANT (antes: del default → FK rota
  // al crear con category de otra tienda + "variantes sin valor" ajenas).
  const adminUser = await getAdminUser()
  if (!adminUser) redirect('/no-autorizado')
  const supabase = getAdminDb(adminUser.tenantId)
  const [{ data: categories }, variantTypes] = await Promise.all([
    supabase.from('categories').select('id, name').eq('active', true).order('name'),
    getVariantTypes(true, supabase),
  ])

  return (
    <div>
      <ProductForm categories={categories ?? []} variantTypes={variantTypes} />
    </div>
  )
}
