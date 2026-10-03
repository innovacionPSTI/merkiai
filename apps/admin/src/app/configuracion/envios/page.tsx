import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader } from '@merkiai/ui'
import { getShippingConfig } from '@merkiai/database'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { canAccess } from '@/lib/roles'
import ShippingConfigForm from '../ShippingConfigForm'

export const metadata: Metadata = { title: 'Envíos · Configuración' }
export const dynamic = 'force-dynamic'

export default async function ConfigEnviosPage() {
  const adminUser = await getAdminUser()
  if (!adminUser || !canAccess(adminUser.role, 'configuracion')) {
    redirect('/no-autorizado')
  }

  const fullAccess = adminUser.role === 'super_admin' || adminUser.role === 'admin'
  if (!fullAccess) redirect('/configuracion/general')

  const shippingConfig = await getShippingConfig(getAdminDb(adminUser.tenantId), adminUser.tenantId).catch(() => null)

  return (
    <div>
      <div className="mb-8">
        <PageHeader title="Envíos" description="Proveedor activo, credenciales y dirección de origen para despachos." />
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <ShippingConfigForm initialConfig={shippingConfig} />
      </div>
    </div>
  )
}
