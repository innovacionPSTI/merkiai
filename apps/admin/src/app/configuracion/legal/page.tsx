import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader } from '@merkiai/ui'
import { getStoreConfig } from '@merkiai/database'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { userCanAccess } from '@/lib/roles'
import { FEATURES as FLAGS } from '@/lib/features'
import { getTenantEntitlements } from '@/lib/entitlements'
import { resolveFeature, FEATURES } from '@merkiai/tenancy'
import LegalConfigForm from '../LegalConfigForm'

export const metadata: Metadata = { title: 'Legal · Configuración' }
export const dynamic = 'force-dynamic'

export default async function ConfigLegalPage() {
  const adminUser = await getAdminUser()
  if (!adminUser || !userCanAccess(adminUser, 'configuracion')) {
    redirect('/no-autorizado')
  }

  // HU-370 · con el Constructor disponible, lo legal se edita como páginas → redirige.
  const { entitlements } = await getTenantEntitlements().catch(() => ({ entitlements: null }))
  if (FLAGS.pageBuilder || resolveFeature(entitlements, FEATURES.PAGE_BUILDER)) {
    redirect('/constructor')
  }

  const storeConfig = await getStoreConfig(getAdminDb(adminUser.tenantId), adminUser.tenantId).catch(() => null)

  return (
    <div>
      <div className="mb-8">
        <PageHeader title="Legal" description="Términos y condiciones y política de privacidad del sitio web. Escribe en Markdown." />
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <LegalConfigForm
          initialTerms={storeConfig?.terms_content ?? null}
          initialPrivacy={storeConfig?.privacy_content ?? null}
        />
      </div>
    </div>
  )
}
