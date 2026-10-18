import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader } from '@merkiai/ui'
import { listRedirects } from '@merkiai/database'
import { requireAdminDb } from '@/lib/admin-context'
import { userCanAccess } from '@/lib/roles'
import RedirectsManager from './RedirectsManager'

export const metadata: Metadata = { title: 'Redirecciones' }
export const dynamic = 'force-dynamic'

/**
 * HU-113 · Gestor de redirects 301. Reglas origen→destino que el storefront
 * resuelve en el middleware. Gated por la sección "configuracion".
 */
export default async function RedirectsPage() {
  const { adminUser, db } = await requireAdminDb()
  if (!userCanAccess(adminUser, 'configuracion')) redirect('/no-autorizado')

  const redirects = await listRedirects(db)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Redirecciones 301"
        description="Redirige URLs viejas a nuevas para no perder tráfico ni SEO al renombrar rutas o slugs."
      />
      <RedirectsManager initial={redirects} />
    </div>
  )
}
