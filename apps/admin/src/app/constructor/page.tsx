import { getAdminUser } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { requireAdminDb } from '@/lib/admin-context'
import { FEATURES } from '@/lib/features'
import ConstructorClient from '@/components/constructor/ConstructorClient'

export const dynamic = 'force-dynamic'

/**
 * Constructor de páginas (HU-218.3, beta). Tras el flag `pageBuilder`; convive
 * con `/contenido`. Editor único schema-driven para cualquier página.
 */
export default async function ConstructorPage() {
  if (!FEATURES.pageBuilder) notFound()

  try {
    await getAdminUser()
  } catch {
    redirect('/sign-in')
  }

  const { db: supabase } = await requireAdminDb()
  const { data: pages } = await supabase.from('pages').select('key, label').order('order_index')
  const pageOptions = (pages ?? []).map((p) => ({ key: p.key as string, label: p.label as string }))
  const initialPageKey = pageOptions.find((p) => p.key === 'home')?.key ?? pageOptions[0]?.key ?? 'home'

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-xl text-brand-primary">Constructor de páginas</h1>
          <span className="rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-semibold px-2 py-0.5">beta</span>
        </div>
        <p className="font-brand text-xs text-brand-primary/50 mt-0.5">
          Compón cualquier página con bloques. Base de los Templates que visten la Web.
        </p>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <ConstructorClient pages={pageOptions} initialPageKey={initialPageKey} />
        </div>
      </div>
    </div>
  )
}
