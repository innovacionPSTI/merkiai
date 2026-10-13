import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader } from '@merkiai/ui'
import { getShippingConfig, listInstances, getProviderDef, SHIPPING_PROVIDERS } from '@merkiai/database'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { canAccess } from '@/lib/roles'
import { maskInstance, publicProviders } from '@/lib/mask-instance'
import ShippingConfigForm from '../ShippingConfigForm'
import IntegrationInstancesForm from '../IntegrationInstancesForm'

export const metadata: Metadata = { title: 'Envíos · Configuración' }
export const dynamic = 'force-dynamic'

export default async function ConfigEnviosPage() {
  const adminUser = await getAdminUser()
  if (!adminUser || !canAccess(adminUser.role, 'configuracion')) redirect('/no-autorizado')

  const fullAccess = adminUser.role === 'super_admin' || adminUser.role === 'admin'
  if (!fullAccess) redirect('/configuracion/general')

  const shippingConfig = await getShippingConfig(getAdminDb(adminUser.tenantId), adminUser.tenantId).catch(() => null)
  const raw = await listInstances(getAdminDb(adminUser.tenantId), adminUser.tenantId, 'shipping').catch(() => [])
  const instances = raw.map((i) => maskInstance(i, getProviderDef('shipping', i.provider)))
  const providers = publicProviders(SHIPPING_PROVIDERS)

  return (
    <div className="space-y-8">
      <div>
        <PageHeader title="Envíos" description="Transportadoras (credenciales) y ajustes de envío: tarifa, envío gratis y dirección de origen. Solo una transportadora activa a la vez." />
      </div>

      {/* Transportadoras (credenciales por instancia — ADR-004) */}
      <div>
        <h2 className="font-display text-brand-primary text-xl mb-1">Transportadoras</h2>
        <p className="font-brand text-sm text-brand-primary/50 mb-4">
          Conecta la cuenta de tu transportadora. Al activar una, la tienda cotiza y genera guías con ella; si no hay ninguna activa, se usa la tarifa fija de abajo.
        </p>
        <IntegrationInstancesForm
          kind="shipping"
          apiBase="/api/admin/shipping-instances"
          addLabel="Agregar transportadora"
          emptyText="Aún no has conectado una transportadora. Se usará la tarifa fija de abajo."
          instances={instances}
          providers={providers}
        />
      </div>

      {/* Ajustes de envío (tarifa fija, envío gratis, dirección de origen) */}
      <div>
        <h2 className="font-display text-brand-primary text-xl mb-1">Ajustes de envío</h2>
        <p className="font-brand text-sm text-brand-primary/50 mb-4">Tarifa fija (fallback), envío gratis y dirección de origen para las guías.</p>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <ShippingConfigForm initialConfig={shippingConfig} />
        </div>
      </div>
    </div>
  )
}
