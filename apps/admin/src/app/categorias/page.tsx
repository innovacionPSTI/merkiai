import { requireAdminDb } from '@/lib/admin-context'
import type { Metadata } from 'next'
import CategoriasClient from './CategoriasClient'

export const metadata: Metadata = { title: 'Categorías' }
export const dynamic = 'force-dynamic'

export default async function CategoriasPage() {
  const { db: supabase } = await requireAdminDb()
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('order_index')

  return <CategoriasClient categories={categories ?? []} />
}
