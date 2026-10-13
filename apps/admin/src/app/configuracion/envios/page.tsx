import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader } from '@merkiai/ui'
import { getShippingConfig, listInstances, getProviderDef, SHIPPING_PROVIDERS } from '@merkiai/database'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { userCanAccess } from '@/lib/roles'
import { maskInstance, publicProviders } from '@/lib/mask-instance'
import { resolveStoreBaseUrl } from '@/lib/store-url'
import ShippingConfigForm from '../ShippingConfigForm'
import ShippingMethodsForm from '../ShippingMethodsForm'

export const metadata: Metadata = { title: 'Envíos · Configuración' }
export const dynamic = 'force-dynamic'

export default async function ConfigEnviosPage() {
  const adminUser = await getAdminUser()
  if (!adminUser || !userCanAccess(adminUser, 'configuracion')) redirect('/no-autorizado')

  const fullAccess = adminUser.role === 'super_admin' || adminUser.role === 'admin'
  if (!fullAccess) redirect('/configuracion/general')

  const shippingConfig = await getShippingConfig(getAdminDb(adminUser.tenantId), adminUser.tenantId).catch(() => null)
  const raw = await listInstances(getAdminDb(adminUser.tenantId), adminUser.tenantId, 'shipping').catch(() => [])
  const instances = raw.map((i) => maskInstance(i, getProviderDef('shipping', i.provider)))
  const providers = publicProviders(SHIPPING_PROVIDERS)
  const storeBaseUrl = await resolveStoreBaseUrl(adminUser.tenantId).catch(() => null)

  return (
    <div className="space-y-8">
      <div>
        <PageHeader title="Envíos" description="Transportadoras (credenciales) y ajustes de envío: tarifa, envío gratis y dirección de origen. Solo una transportadora activa a la vez." />
      </div>

      {/* Métodos de envío (tarifa fija + transportadoras, un solo activo) */}
      <div>
        <h2 className="font-display text-brand-primary text-xl mb-1">Métodos de envío</h2>
        <p className="font-brand text-sm text-brand-primary/50 mb-4">
          Elige cómo se cobra el envío. Solo un método activo a la vez: la tarifa fija o una transportadora que cotiza en tiempo real y genera guías.
        </p>
        <ShippingMethodsForm
          provider={(shippingConfig?.provider as 'fixed' | 'skydropx') ?? 'fixed'}
          fixedRate={shippingConfig?.fixed_rate ?? 8000}
          instances={instances}
          providers={providers}
          storeBaseUrl={storeBaseUrl}
        />
      </div>

      {/* Ajustes globales (envío gratis, cargo adicional, dirección de origen) */}
      <div>
        <h2 className="font-display text-brand-primary text-xl mb-1">Ajustes globales</h2>
        <p className="font-brand text-sm text-brand-primary/50 mb-4">Envío gratis, cargo adicional y dirección de origen. Aplican sin importar el método activo.</p>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <ShippingConfigForm initialConfig={shippingConfig} />
        </div>
      </div>
    </div>
  )
}
