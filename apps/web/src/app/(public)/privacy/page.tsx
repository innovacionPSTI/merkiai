import type { Metadata } from 'next'
import { getPageWithSections } from '@merkiai/database'
import { getStoreContext } from '@/lib/store-context'
import LegalPage from '@/components/legal/LegalPage'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const ctx = await getStoreContext().catch(() => null)
  const config = ctx?.config ?? null
  const page = ctx ? await getPageWithSections('privacy', true, ctx.db).catch(() => null) : null
  return {
    title: page?.meta_title ?? `Política de privacidad | ${config?.store_name ?? 'Mi Tienda'}`,
    description: page?.meta_description ?? undefined,
    robots: { index: true, follow: true },
  }
}

export default async function PrivacidadPage() {
  const ctx = await getStoreContext().catch(() => null)
  const config = ctx?.config ?? null
  const page = ctx ? await getPageWithSections('privacy', true, ctx.db).catch(() => null) : null

  // Extraer contenido del primer section_type='text' (seed de migración 18)
  const textSection = page?.sections?.find((s) => s.section_type === 'text')
  const content = textSection?.body ?? config?.privacy_content ?? null

  return (
    <LegalPage
      title={textSection?.title ?? 'Política de privacidad'}
      content={content}
      storeName={config?.store_name ?? 'Mi Tienda'}
    />
  )
}
