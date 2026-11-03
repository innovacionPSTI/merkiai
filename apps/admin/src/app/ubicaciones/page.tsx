import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader } from '@merkiai/ui'
import { listLocations } from '@merkiai/database'
import { requireAdminDb } from '@/lib/admin-context'
import { userCanAccess } from '@/lib/roles'
import { getTenantEntitlements } from '@/lib/entitlements'
import { resolveFeature, FEATURES } from '@merkiai/tenancy'
import LocationsManager from './LocationsManager'

export const metadata: Metadata = { title: 'Ubicaciones' }
export const dynamic = 'force-dynamic'

/** E18 · Ubicaciones (HU-176): bodegas, tiendas y puntos de retiro; dimensión de
 *  ubicación del ledger. Gated por `multi_location`. */
export default async function UbicacionesPage() {
  const { adminUser, db } = await requireAdminDb()
  if (!userCanAccess(adminUser, 'sistema')) redirect('/no-autorizado')
  const { entitlements } = await getTenantEntitlements().catch(() => ({ entitlements: null }))
  if (!resolveFeature(entitlements, FEATURES.MULTI_LOCATION)) notFound()

  const locations = await listLocations(db)

  return (
    <div className="space-y-6">
      <PageHeader title="Ubicaciones" description="Bodegas, tiendas físicas y puntos de retiro. La ubicación es la dimensión del inventario: el disponible por ubicación se proyecta del libro de movimientos." />
      <LocationsManager locations={locations.map((l) => ({ id: l.id, code: l.code, name: l.name, kind: l.kind, city: l.city, is_default: l.is_default, active: l.active }))} />
    </div>
  )
}
