import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader } from '@merkiai/ui'
import { getAdminUser } from '@/lib/auth'
import { canAccess } from '@/lib/roles'
import { getDomainState } from '@/lib/domains'
import DominioClient from './DominioClient'

export const metadata: Metadata = { title: 'Dominio · Configuración' }
export const dynamic = 'force-dynamic'

export default async function DominioPage() {
  const adminUser = await getAdminUser()
  if (!adminUser || !canAccess(adminUser.role, 'configuracion')) redirect('/no-autorizado')

  const state = await getDomainState(adminUser.tenantId)

  return (
    <div>
      <div className="mb-8">
        <PageHeader
          title="Dominio propio"
          description="Conecta tu propio dominio a la tienda. Tu tienda también seguirá disponible en tu subdominio *.merkiai.com."
        />
      </div>
      <DominioClient state={state} />
    </div>
  )
}
