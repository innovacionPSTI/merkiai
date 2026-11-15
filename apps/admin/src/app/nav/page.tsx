import { getAdminUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { requireAdminDb } from '@/lib/admin-context'
import NavClient from './NavClient'
import { T } from '@merkiai/ui'

export const dynamic = 'force-dynamic'

export default async function NavPage() {
  try {
    await getAdminUser()
  } catch {
    redirect('/sign-in')
  }

  const { db: supabase } = await requireAdminDb()
  const { data: navItems } = await supabase
    .from('nav_items')
    .select('*')
    .order('order_index')

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="font-display text-2xl text-brand-primary"><T>Navegación</T></h1>
        <p className="font-brand text-sm text-brand-primary/50 mt-1">
          <T>Configura los ítems del menú principal. Los cambios se reflejan de inmediato en el sitio.</T>
        </p>
      </div>
      <NavClient initialItems={navItems ?? []} />
    </div>
  )
}
