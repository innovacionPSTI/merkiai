import { requireAdminDb } from '@/lib/admin-context'
import type { Metadata } from 'next'
import { PageHeader } from '@merkiai/ui'
import MediaClient from './MediaClient'
import { getStorageUsage } from '@merkiai/database'
import { getTenantEntitlements, resolveLimit, LIMITS } from '@/lib/entitlements'

export const metadata: Metadata = { title: 'Media' }
export const dynamic = 'force-dynamic'

export default async function MediaPage() {
  const { db: supabase, adminUser } = await requireAdminDb()
  const tenantId = adminUser.tenantId
  const [{ data }, usage, ent] = await Promise.all([
    supabase.from('media_assets').select('*').order('created_at', { ascending: false }).limit(200),
    getStorageUsage(supabase, tenantId).catch(() => null),
    getTenantEntitlements(tenantId).catch(() => ({ entitlements: null })),
  ])
  // HU-432 · uso de almacenamiento vs. tope del plan.
  const limitMb = resolveLimit(ent.entitlements, LIMITS.MAX_MEDIA_MB)
  const usedMb = usage ? usage.bytes / (1024 * 1024) : null
  const pct = usedMb != null && limitMb ? Math.min(100, Math.round((usedMb / limitMb) * 100)) : null
  const fmt = (n: number) => n.toLocaleString('es-CO', { maximumFractionDigits: 1 })

  return (
    <div className="space-y-2">
      <div className="mb-6">
        <PageHeader title="Archivos" description="Imágenes y archivos subidos al almacenamiento." />
      </div>

      {usedMb != null && (
        <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 font-brand text-sm text-brand-primary">
          <div className="flex justify-between">
            <span>Almacenamiento usado</span>
            <span className="text-brand-primary/70">{fmt(usedMb)} MB{limitMb != null ? ` de ${fmt(limitMb)} MB` : ' (sin límite en tu plan)'}</span>
          </div>
          {pct != null && (
            <div className="mt-2 h-2 rounded-full bg-gray-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Uso de almacenamiento">
              <div className={`h-2 rounded-full ${pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-brand-primary'}`} style={{ width: `${pct}%` }} />
            </div>
          )}
        </div>
      )}
      <MediaClient initialAssets={data ?? []} />
    </div>
  )
}
