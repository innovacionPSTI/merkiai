import { requireAdminDb } from '@/lib/admin-context'
import type { Metadata } from 'next'
import { PageHeader } from '@merkiai/ui'
import MediaClient from './MediaClient'

export const metadata: Metadata = { title: 'Media' }
export const dynamic = 'force-dynamic'

export default async function MediaPage() {
  const { db: supabase } = await requireAdminDb()
  const { data } = await supabase
    .from('media_assets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <div className="space-y-2">
      <div className="mb-6">
        <PageHeader title="Archivos" description="Imágenes y archivos subidos al almacenamiento." />
      </div>

      <MediaClient initialAssets={data ?? []} />
    </div>
  )
}
