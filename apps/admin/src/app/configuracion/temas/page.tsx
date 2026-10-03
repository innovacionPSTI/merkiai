import { redirect } from 'next/navigation'
import { PageHeader } from '@merkiai/ui'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { canAccess } from '@/lib/roles'
import { getThemes } from '@merkiai/database'
import TemasClient from './TemasClient'

export const metadata = { title: 'Temas' }

export default async function TemasPage() {
  const adminUser = await getAdminUser()
  if (!adminUser) redirect('/sign-in')
  if (!canAccess(adminUser.role, 'configuracion')) redirect('/dashboard')

  const themes = await getThemes(getAdminDb(adminUser.tenantId)).catch(() => [])

  return (
    <div className="max-w-5xl mx-auto py-10 px-6">
      <div className="mb-8">
        <PageHeader
          title="Temas"
          description="Personaliza la paleta de colores y tipografía del sitio web. El tema activo se aplica de forma inmediata en la próxima carga de página."
        />
      </div>
      <TemasClient initialThemes={themes} />
    </div>
  )
}
