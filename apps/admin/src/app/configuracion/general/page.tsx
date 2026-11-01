import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader } from '@merkiai/ui'
import { getStoreConfig } from '@merkiai/database'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { userCanAccess, userCanManageData } from '@/lib/roles'
import { FEATURES as FLAGS } from '@/lib/features'
import { getTenantEntitlements } from '@/lib/entitlements'
import { resolveFeature, FEATURES } from '@merkiai/tenancy'
import StoreConfigForm from '../StoreConfigForm'
import DataTransferWidget from '../DataTransferWidget'
import BackupWidget from '../BackupWidget'

export const metadata: Metadata = { title: 'General · Configuración' }
export const dynamic = 'force-dynamic'

export default async function ConfigGeneralPage() {
  const adminUser = await getAdminUser()
  if (!adminUser || !userCanAccess(adminUser, 'configuracion')) {
    redirect('/no-autorizado')
  }

  const storeConfig = await getStoreConfig(getAdminDb(adminUser.tenantId), adminUser.tenantId).catch(() => null)

  // HU-371 · si el Constructor está disponible, lo editorial se edita allí (no duplicar).
  const { entitlements } = await getTenantEntitlements().catch(() => ({ entitlements: null }))
  const editorialInConstructor = FLAGS.pageBuilder || resolveFeature(entitlements, FEATURES.PAGE_BUILDER)

  return (
    <div>
      <div className="mb-8">
        <PageHeader title="General" description="Datos de contacto y nombre de la tienda." />
      </div>

      <StoreConfigForm initialConfig={storeConfig} editorialInConstructor={editorialInConstructor} />

      <div className="mt-8">
        <h2 className="font-display text-brand-primary text-xl mb-1">Contenido del sitio</h2>
        <p className="font-brand text-sm text-brand-primary/50 mb-4">
          Exporta o importa el contenido del sitio (páginas, navegación, banners, secciones).
        </p>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <DataTransferWidget />
        </div>
      </div>

      <div className="mt-8">
        <h2 className="font-display text-brand-primary text-xl mb-1">Respaldos de datos</h2>
        <p className="font-brand text-sm text-brand-primary/50 mb-4">
          Descarga una copia de tus productos, pedidos y clientes.
        </p>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          {userCanManageData(adminUser) && <BackupWidget />}
        </div>
      </div>
    </div>
  )
}
