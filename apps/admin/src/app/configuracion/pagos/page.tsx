import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader } from '@merkiai/ui'
import { listInstances, getProviderDef, PAYMENT_PROVIDERS } from '@merkiai/database'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { userCanAccess } from '@/lib/roles'
import { resolveStoreBaseUrl } from '@/lib/store-url'
import { maskInstance, publicProviders } from '@/lib/mask-instance'
import IntegrationInstancesForm from '../IntegrationInstancesForm'

export const metadata: Metadata = { title: 'Pagos · Configuración' }
export const dynamic = 'force-dynamic'

export default async function ConfigPagosPage() {
  const adminUser = await getAdminUser()
  if (!adminUser || !userCanAccess(adminUser, 'configuracion')) redirect('/no-autorizado')

  const fullAccess = adminUser.role === 'super_admin' || adminUser.role === 'admin'
  if (!fullAccess) redirect('/configuracion/general')

  // ADR-004: instancias de pago (varias por pasarela, una activa). Credenciales
  // enmascaradas antes de pasar al cliente.
  const raw = await listInstances(getAdminDb(adminUser.tenantId), adminUser.tenantId, 'payment').catch(() => [])
  const instances = raw.map((i) => maskInstance(i, getProviderDef('payment', i.provider)))
  const providers = publicProviders(PAYMENT_PROVIDERS)
  const storeBaseUrl = await resolveStoreBaseUrl(adminUser.tenantId).catch(() => null)

  return (
    <div>
      <div className="mb-8">
        <PageHeader title="Pagos" description="Agrega los medios de pago que uses. Puedes tener varias configuraciones por pasarela (p. ej. Pruebas y Producción); solo una cobra a la vez. Los secretos nunca se exponen al cliente." />
      </div>
      <IntegrationInstancesForm
        kind="payment"
        apiBase="/api/admin/payment-instances"
        addLabel="Agregar medio de pago"
        emptyText="Aún no has agregado un medio de pago. Mientras tanto, cada pedido queda en pago manual."
        instances={instances}
        providers={providers}
        storeBaseUrl={storeBaseUrl}
        showEnv
        showWebhook
      />
    </div>
  )
}
