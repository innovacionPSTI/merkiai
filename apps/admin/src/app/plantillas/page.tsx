import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getAdminUser } from '@/lib/auth'
import { userCanAccess } from '@/lib/roles'
import { getOnboardingOptions } from '@/lib/onboarding'
import PlantillasGallery from './PlantillasGallery'
import { T } from '@merkiai/ui'

export const metadata: Metadata = { title: 'Plantillas · Galería' }
export const dynamic = 'force-dynamic'

export default async function PlantillasPage() {
  const adminUser = await getAdminUser()
  if (!adminUser || !userCanAccess(adminUser, 'configuracion')) {
    redirect('/no-autorizado')
  }

  const options = await getOnboardingOptions(adminUser.tenantId)

  return (
    <div>
      <div className="mb-8">
        <p className="font-brand text-xs text-brand-primary/40 uppercase tracking-wider mb-1"><T>Diseño</T></p>
        <h1 className="font-display text-brand-primary text-3xl"><T>Galería de plantillas</T></h1>
        <p className="font-brand text-sm text-brand-primary/50 mt-1">
          <T>Elige una plantilla de tu nicho y aplícala para vestir tu tienda. Podrás ajustarlo todo desde el panel.</T>
        </p>
      </div>

      {options ? (
        <PlantillasGallery options={options} />
      ) : (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="font-brand text-sm text-brand-primary/60">
            <T>No se pudo consultar el catálogo de plantillas en este momento. Inténtalo más tarde o configura tu tienda manualmente desde las secciones del panel.</T>
          </p>
        </div>
      )}
    </div>
  )
}
