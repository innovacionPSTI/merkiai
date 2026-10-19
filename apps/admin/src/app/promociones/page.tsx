import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader } from '@merkiai/ui'
import { listPromotions } from '@merkiai/database'
import { requireAdminDb } from '@/lib/admin-context'
import { userCanAccess } from '@/lib/roles'
import PromotionsManager from './PromotionsManager'

export const metadata: Metadata = { title: 'Promociones' }
export const dynamic = 'force-dynamic'

/**
 * HU-147 · Motor de descuentos y promociones. Reglas más allá de cupones
 * (BOGO, % por categoría, descuento por monto de carrito). El total se calcula
 * en el servidor (checkout). Gated por la sección "cupones".
 */
export default async function PromocionesPage() {
  const { adminUser, db } = await requireAdminDb()
  if (!userCanAccess(adminUser, 'cupones')) redirect('/no-autorizado')

  const [promotions, categories] = await Promise.all([
    listPromotions(db),
    db.from('categories').select('id, name').order('name'),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Promociones"
        description="Descuentos automáticos: por monto de carrito, por categoría o BOGO. Se aplican en el checkout."
      />
      <PromotionsManager initial={promotions} categories={categories.data ?? []} />
    </div>
  )
}
