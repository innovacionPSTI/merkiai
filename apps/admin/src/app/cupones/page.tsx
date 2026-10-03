import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader } from '@merkiai/ui'
import { getCoupons } from '@merkiai/database'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { canAccess } from '@/lib/roles'
import CuponesClient from './CuponesClient'

export const metadata: Metadata = { title: 'Cupones' }
export const dynamic = 'force-dynamic'

export default async function CuponesPage() {
  const adminUser = await getAdminUser()
  if (!adminUser || !canAccess(adminUser.role, 'cupones')) {
    redirect('/no-autorizado')
  }

  const coupons = await getCoupons(getAdminDb(adminUser.tenantId)).catch(() => [])

  return (
    <div>
      <div className="mb-8">
        <PageHeader title="Cupones" description="Crea y administra los códigos de descuento de tu tienda." />
      </div>
      <CuponesClient initialCoupons={coupons} />
    </div>
  )
}
