import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getAdminUser } from '@/lib/auth'
import { canAccess } from '@/lib/roles'
import { getOnboardingOptions, getOnboardingProgress } from '@/lib/onboarding'
import OnboardingWizard from './OnboardingWizard'

export const metadata: Metadata = { title: 'Onboarding · Configura tu tienda' }
export const dynamic = 'force-dynamic'

export default async function OnboardingPage() {
  const adminUser = await getAdminUser()
  if (!adminUser || !canAccess(adminUser.role, 'configuracion')) {
    redirect('/no-autorizado')
  }

  const [options, progress] = await Promise.all([
    getOnboardingOptions(adminUser.tenantId),
    getOnboardingProgress(adminUser.tenantId),
  ])

  return (
    <div>
      <div className="mb-8">
        <p className="font-brand text-xs text-brand-primary/40 uppercase tracking-wider mb-1">Puesta a punto</p>
        <h1 className="font-display text-brand-primary text-3xl">Configura tu tienda</h1>
        <p className="font-brand text-sm text-brand-primary/50 mt-1">
          Empieza desde una plantilla de tu nicho y ajusta el resto desde el panel.
        </p>
      </div>

      {options ? (
        <OnboardingWizard options={options} progress={progress} />
      ) : (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="font-brand text-sm text-brand-primary/60">
            No se pudo consultar el catálogo de presets en este momento. Puedes configurar tu tienda
            manualmente desde las secciones del panel e intentar el onboarding más tarde.
          </p>
        </div>
      )}
    </div>
  )
}
