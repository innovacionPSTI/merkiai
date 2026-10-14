import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader } from '@merkiai/ui'
import { requireAdminDb } from '@/lib/admin-context'
import { userCanAccess } from '@/lib/roles'
import ReportesClient from './ReportesClient'

export const metadata: Metadata = { title: 'Reportes' }
export const dynamic = 'force-dynamic'

/**
 * HU-116 · Reportes de ventas. Gated por el acceso a Pedidos (Ventas). Las
 * métricas y la exportación se resuelven en `/api/admin/reports/sales`.
 */
export default async function ReportesPage() {
  const { adminUser } = await requireAdminDb()
  if (!userCanAccess(adminUser, 'pedidos')) redirect('/no-autorizado')

  return (
    <div className="space-y-6">
      <PageHeader title="Reportes de ventas" description="Ingresos, pedidos, ticket promedio y top productos por período." />
      <ReportesClient />
    </div>
  )
}
