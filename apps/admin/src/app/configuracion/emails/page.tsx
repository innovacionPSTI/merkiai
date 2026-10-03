import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader } from '@merkiai/ui'
import { getStoreConfig } from '@merkiai/database'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { canAccess } from '@/lib/roles'
import EmailConfigForm from '../EmailConfigForm'

export const metadata: Metadata = { title: 'Emails · Configuración' }
export const dynamic = 'force-dynamic'

export default async function ConfigEmailsPage() {
  const adminUser = await getAdminUser()
  if (!adminUser || !canAccess(adminUser.role, 'configuracion')) {
    redirect('/no-autorizado')
  }

  const fullAccess = adminUser.role === 'super_admin' || adminUser.role === 'admin'
  if (!fullAccess) redirect('/configuracion/general')

  const storeConfig = await getStoreConfig(getAdminDb(adminUser.tenantId), adminUser.tenantId).catch(() => null)

  const emailConfigData = storeConfig
    ? {
        resend_from_email: storeConfig.resend_from_email,
        has_resend_api_key: !!storeConfig.resend_api_key,
        email_provider: storeConfig.email_provider ?? 'resend',
      }
    : null

  return (
    <div>
      <div className="mb-8">
        <PageHeader title="Emails" description="Resend para confirmaciones de pedido, newsletters y notificaciones transaccionales." />
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <EmailConfigForm initialConfig={emailConfigData} />
      </div>
    </div>
  )
}
