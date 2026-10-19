import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader } from '@merkiai/ui'
import { listSegments, listCampaigns } from '@merkiai/database'
import { requireAdminDb } from '@/lib/admin-context'
import { getTenantEntitlements, resolveFeature, FEATURES } from '@/lib/entitlements'
import { userCanAccess } from '@/lib/roles'
import VipManager from './VipManager'

export const metadata: Metadata = { title: 'Ventas VIP' }
export const dynamic = 'force-dynamic'

/**
 * HU-288/289 · Club VIP. Segmentos de clientes + campañas de acceso anticipado.
 * Gated por la sección "ventas_vip" (rol) y el entitlement `vip_early_access`
 * (plan). El entitlement falla-abierto cuando no hay control plane configurado
 * (consistente con el resto del admin: los límites/planes son regla de negocio,
 * no frontera de seguridad; la RLS sí aísla los datos por tenant).
 */
export default async function VentasVipPage() {
  const { adminUser, db } = await requireAdminDb()
  if (!userCanAccess(adminUser, 'ventas_vip')) redirect('/no-autorizado')

  const { entitlements } = await getTenantEntitlements(adminUser.tenantId).catch(() => ({ entitlements: null }))
  const vipEnabled = entitlements == null ? true : resolveFeature(entitlements, FEATURES.VIP_EARLY_ACCESS)
  if (!vipEnabled) redirect('/no-autorizado')

  const [segments, campaigns, products, categories] = await Promise.all([
    listSegments(db),
    listCampaigns(db),
    db.from('products').select('id, name').eq('active', true).order('name'),
    db.from('categories').select('id, name').order('name'),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ventas VIP"
        description="Segmenta a tus clientes y abre ventas exclusivas por tiempo limitado (acceso anticipado)."
      />
      <VipManager
        initialSegments={segments}
        initialCampaigns={campaigns}
        products={products.data ?? []}
        categories={categories.data ?? []}
      />
    </div>
  )
}
