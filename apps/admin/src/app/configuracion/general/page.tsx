import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader } from '@merkiai/ui'
import { getStoreConfig } from '@merkiai/database'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { canAccess } from '@/lib/roles'
import StoreConfigForm from '../StoreConfigForm'
import DataTransferWidget from '../DataTransferWidget'

export const metadata: Metadata = { title: 'General · Configuración' }
export const dynamic = 'force-dynamic'

export default async function ConfigGeneralPage() {
  const adminUser = await getAdminUser()
  if (!adminUser || !canAccess(adminUser.role, 'configuracion')) {
    redirect('/no-autorizado')
  }

  const storeConfig = await getStoreConfig(getAdminDb(adminUser.tenantId), adminUser.tenantId).catch(() => null)

  return (
    <div>
      <div className="mb-8">
        <PageHeader title="General" description="Datos de contacto y nombre de la tienda." />
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <StoreConfigForm initialConfig={storeConfig} />
      </div>

      <div className="mt-8">
        <h2 className="font-display text-brand-primary text-xl mb-1">Datos y respaldos</h2>
        <p className="font-brand text-sm text-brand-primary/50 mb-4">
          Exporta o importa el contenido del sitio (páginas, navegación, banners, secciones).
        </p>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <DataTransferWidget />
        </div>
      </div>
    </div>
  )
}
