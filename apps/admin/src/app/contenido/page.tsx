import { getAdminUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { requireAdminDb } from '@/lib/admin-context'
import { FEATURES as FLAGS } from '@/lib/features'
import { getTenantEntitlements } from '@/lib/entitlements'
import { resolveFeature, FEATURES } from '@merkiai/tenancy'
import ContenidoClient from './ContenidoClient'

export const dynamic = 'force-dynamic'

export default async function ContenidoPage() {
  try {
    await getAdminUser()
  } catch {
    redirect('/sign-in')
  }

  // HU-368 · con el Constructor disponible, "Páginas" se unificó en él → redirige.
  const { entitlements } = await getTenantEntitlements().catch(() => ({ entitlements: null }))
  if (FLAGS.pageBuilder || resolveFeature(entitlements, FEATURES.PAGE_BUILDER)) {
    redirect('/constructor')
  }

  const { db: supabase } = await requireAdminDb()
  const [{ data: pages }, { data: navItems }, { data: sections }, { data: items }] =
    await Promise.all([
      supabase.from('pages').select('*').order('order_index'),
      supabase.from('nav_items').select('*').order('order_index'),
      supabase.from('page_sections').select('*').order('order_index'),
      supabase.from('section_items').select('*').order('order_index'),
    ])

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="px-6 py-4 border-b border-gray-100">
        <h1 className="font-display text-xl text-brand-primary">Contenido</h1>
        <p className="font-brand text-xs text-brand-primary/50 mt-0.5">
          Gestiona la navegación, las páginas y sus secciones desde un solo lugar.
        </p>
      </div>
      <ContenidoClient
        initialPages={pages ?? []}
        initialNavItems={navItems ?? []}
        initialSections={sections ?? []}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initialItems={(items ?? []) as any[]}
      />
    </div>
  )
}
