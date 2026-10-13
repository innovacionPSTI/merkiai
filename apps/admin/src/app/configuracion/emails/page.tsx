import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader } from '@merkiai/ui'
import { listInstances, getProviderDef, EMAIL_PROVIDERS } from '@merkiai/database'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { canAccess } from '@/lib/roles'
import { maskInstance, publicProviders } from '@/lib/mask-instance'
import IntegrationInstancesForm from '../IntegrationInstancesForm'

export const metadata: Metadata = { title: 'Emails · Configuración' }
export const dynamic = 'force-dynamic'

export default async function ConfigEmailsPage() {
  const adminUser = await getAdminUser()
  if (!adminUser || !canAccess(adminUser.role, 'configuracion')) redirect('/no-autorizado')

  const fullAccess = adminUser.role === 'super_admin' || adminUser.role === 'admin'
  if (!fullAccess) redirect('/configuracion/general')

  const raw = await listInstances(getAdminDb(adminUser.tenantId), adminUser.tenantId, 'email').catch(() => [])
  const instances = raw.map((i) => maskInstance(i, getProviderDef('email', i.provider)))
  const providers = publicProviders(EMAIL_PROVIDERS)

  return (
    <div>
      <div className="mb-8">
        <PageHeader title="Emails" description="Proveedor de correo para confirmaciones de pedido, newsletters y notificaciones transaccionales. Solo uno activo a la vez." />
      </div>
      <IntegrationInstancesForm
        kind="email"
        apiBase="/api/admin/email-instances"
        addLabel="Agregar proveedor de correo"
        emptyText="Aún no has configurado un proveedor de correo. Los emails transaccionales no se enviarán hasta configurarlo."
        instances={instances}
        providers={providers}
        showEnv={false}
      />
    </div>
  )
}
