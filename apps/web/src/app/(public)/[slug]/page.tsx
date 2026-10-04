/**
 * Ruta dinámica para páginas CMS gestionadas desde el admin.
 *
 * Funcionamiento:
 *   1. Busca la página por slug en la tabla `pages`
 *   2. Carga sus secciones + ítems con getPageWithSections()
 *   3. Renderiza cada sección con SectionRenderer
 *
 * Las rutas explícitas (/, /shop, /blog, /checkout, /account…)
 * tienen prioridad sobre esta ruta dinámica en Next.js.
 *
 * No contiene ningún string específico de café o dominio.
 */
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPageWithSections } from '@merkiai/database'
import { getStoreContext } from '@/lib/store-context'
import { getMachineDb } from '@/lib/machine-db'
import { isPreviewMode } from '@/lib/preview'
import SectionRenderer from '@/components/sections/SectionRenderer'
import { getRequestCatalogDb } from '@/lib/tenant-db'
import PreviewBanner from '@/components/PreviewBanner'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = await getPageWithSections(slug, true, await getRequestCatalogDb()).catch(() => null)
  if (!page) return {}

  return {
    title: page.meta_title ?? page.label,
    description: page.meta_description ?? undefined,
  }
}

export default async function CmsPage({ params }: Props) {
  const { slug } = await params
  const preview = await isPreviewMode()
  const ctx = await getStoreContext().catch(() => null)
  if (!ctx) notFound()

  // Preview (HU-128): cliente-máquina (is_admin) ve página/secciones/ítems
  // deshabilitados; `onlyEnabled=false` incluye lo que está en borrador.
  const db = preview ? getMachineDb(ctx.tenantId) : ctx.db
  const pageData = await getPageWithSections(slug, !preview, db).catch(() => null)
  if (!pageData) notFound()

  return (
    <div className="bg-brand-cream min-h-screen pt-16">
      {preview && <PreviewBanner />}
      {pageData.sections.map((section) => {
        const hidden = section.enabled === false
        return (
          <div key={section.id} style={hidden ? { opacity: 0.55, outline: '2px dashed #d97706', outlineOffset: -2 } : undefined}>
            <SectionRenderer
              section={section}
              pageKey={pageData.key}
              whatsappNumber={ctx.config?.whatsapp_number}
            />
          </div>
        )
      })}
    </div>
  )
}
