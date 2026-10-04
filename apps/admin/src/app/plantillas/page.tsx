import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getAdminUser } from '@/lib/auth'
import { canAccess } from '@/lib/roles'
import { getOnboardingOptions } from '@/lib/onboarding'
import PlantillasGallery from './PlantillasGallery'

export const metadata: Metadata = { title: 'Plantillas · Galería' }
export const dynamic = 'force-dynamic'

export default async function PlantillasPage() {
  const adminUser = await getAdminUser()
  if (!adminUser || !canAccess(adminUser.role, 'configuracion')) {
    redirect('/no-autorizado')
  }

  const options = await getOnboardingOptions(adminUser.tenantId)

  return (
    <div>
      <div className="mb-8">
        <p className="font-brand text-xs text-brand-primary/40 uppercase tracking-wider mb-1">Diseño</p>
        <h1 className="font-display text-brand-primary text-3xl">Galería de plantillas</h1>
        <p className="font-brand text-sm text-brand-primary/50 mt-1">
          Elige una plantilla de tu nicho y aplícala para vestir tu tienda. Podrás ajustarlo todo desde el panel.
        </p>
      </div>

      {options ? (
        <PlantillasGallery options={options} />
      ) : (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="font-brand text-sm text-brand-primary/60">
            No se pudo consultar el catálogo de plantillas en este momento. Inténtalo más tarde o configura tu tienda
            manualmente desde las secciones del panel.
          </p>
        </div>
      )}
    </div>
  )
}
