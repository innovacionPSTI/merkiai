import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader } from '@merkiai/ui'
import { getAdminUser } from '@/lib/auth'
import { userCanAccess } from '@/lib/roles'
import { listCustomDomains } from '@/lib/custom-domains'
import DominioClient from './DominioClient'

export const metadata: Metadata = { title: 'Dominio · Configuración' }
export const dynamic = 'force-dynamic'

export default async function DominioPage() {
  const adminUser = await getAdminUser()
  if (!adminUser || !userCanAccess(adminUser, 'configuracion')) redirect('/no-autorizado')

  const domains = await listCustomDomains(adminUser.tenantId)

  return (
    <div>
      <div className="mb-8">
        <PageHeader
          title="Dominios"
          description="Conecta uno o varios dominios propios. Marca uno como principal (canónico). Tu tienda también seguirá disponible en tu subdominio *.merkiai.com."
        />
      </div>
      <DominioClient domains={domains} />
    </div>
  )
}
