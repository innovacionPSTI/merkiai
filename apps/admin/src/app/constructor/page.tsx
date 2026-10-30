import { getAdminUser } from '@/lib/auth'
import PreviewButton from './PreviewButton'
import { redirect, notFound } from 'next/navigation'
import { requireAdminDb } from '@/lib/admin-context'
import { FEATURES as FLAGS } from '@/lib/features'
import { getTenantEntitlements } from '@/lib/entitlements'
import { resolveFeature, FEATURES } from '@merkiai/tenancy'
import ConstructorClient from '@/components/constructor/ConstructorClient'

export const dynamic = 'force-dynamic'

/**
 * Constructor de páginas (HU-218.3 → HU-350 hub). Acceso: entitlement
 * `page_builder` del plan (HU-359) **o** el flag técnico legacy `pageBuilder`
 * (graduación sin pérdida de funcionalidad, AC-5). Convive con `/contenido`.
 */
export default async function ConstructorPage() {
  try {
    await getAdminUser()
  } catch {
    redirect('/sign-in')
  }

  // HU-359 · entitlements del plan (fail-open: sin control-plane → defaults del catálogo).
  const { entitlements } = await getTenantEntitlements().catch(() => ({ entitlements: null }))
  const pageBuilderEnabled = FLAGS.pageBuilder || resolveFeature(entitlements, FEATURES.PAGE_BUILDER)
  if (!pageBuilderEnabled) notFound()

  const constructorFeatures = {
    layoutAdvanced: resolveFeature(entitlements, FEATURES.LAYOUT_ADVANCED),
    pageStyle: resolveFeature(entitlements, FEATURES.PAGE_STYLE),
  }

  const { db: supabase } = await requireAdminDb()
  const [{ data: pages }, { data: cfg }] = await Promise.all([
    supabase.from('pages').select('key, label, slug, style, page_type, enabled').order('order_index'),
    supabase.from('store_config').select('template').maybeSingle(),
  ])
  const pageOptions = (pages ?? []).map((p) => ({
    key: p.key as string,
    label: p.label as string,
    slug: (p.slug as string) ?? '',
    style: (p as { style?: unknown }).style ?? null,
    page_type: ((p as { page_type?: string }).page_type ?? 'custom'),
    enabled: (p as { enabled?: boolean }).enabled ?? true,
  }))
  const initialPageKey = pageOptions.find((p) => p.key === 'home')?.key ?? pageOptions[0]?.key ?? 'home'
  const initialTemplate = (cfg?.template as string | undefined) ?? 'default'

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl text-brand-primary">Constructor de páginas</h1>
            <span className="rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-semibold px-2 py-0.5">beta</span>
          </div>
          <p className="font-brand text-xs text-brand-primary/50 mt-0.5">
            Compón cualquier página con bloques. Base de los Templates que visten la Web.
          </p>
        </div>
        <PreviewButton />
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <ConstructorClient pages={pageOptions} initialPageKey={initialPageKey} initialTemplate={initialTemplate} features={constructorFeatures} />
        </div>
      </div>
    </div>
  )
}
