import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { listReviews } from '@merkiai/database'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { canAccess } from '@/lib/roles'
import ReviewsClient from './ReviewsClient'

export const metadata: Metadata = { title: 'Reseñas' }
export const dynamic = 'force-dynamic'

export default async function ReviewsPage() {
  const adminUser = await getAdminUser()
  if (!adminUser || !canAccess(adminUser.role, 'productos')) redirect('/no-autorizado')

  const db = getAdminDb(adminUser.tenantId)
  const reviews = await listReviews(db)

  // Nombres de producto para mostrar en la lista.
  const ids = [...new Set(reviews.map((r) => r.product_id))]
  const productNames: Record<number, string> = {}
  if (ids.length > 0) {
    const { data } = await db.from('products').select('id, name').in('id', ids)
    for (const p of data ?? []) productNames[p.id as number] = p.name as string
  }

  return <ReviewsClient initial={reviews} productNames={productNames} />
}
