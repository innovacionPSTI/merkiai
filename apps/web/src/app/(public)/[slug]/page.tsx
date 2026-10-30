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
import { groupSectionsIntoRows, cellSpanClass } from '@/lib/section-rows'
import { pageStyleVars } from '@/lib/page-style'
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
    <div className="bg-brand-cream min-h-screen pt-16" style={pageStyleVars((pageData as { style?: unknown }).style)}>
      {preview && <PreviewBanner />}
      {/* HU-351 · agrupa en Filas/Columnas (opt-in). Sin row_id = fila full-width
          (idéntico a antes). Con row_id = grilla de 12 que apila en móvil. */}
      {groupSectionsIntoRows(pageData.sections).map((row, ri) => {
        const hiddenStyle = { opacity: 0.55, outline: '2px dashed #d97706', outlineOffset: -2 } as const
        if (row.single) {
          const section = row.cells[0].section
          return (
            <div key={section.id} style={section.enabled === false ? hiddenStyle : undefined}>
              <SectionRenderer section={section} pageKey={pageData.key} whatsappNumber={ctx.config?.whatsapp_number} />
            </div>
          )
        }
        return (
          <div key={`row-${row.rowId}-${ri}`} className="mx-auto max-w-7xl px-4 py-2 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {row.cells.map(({ section, span }) => (
              <div key={section.id} className={cellSpanClass(span)} style={section.enabled === false ? hiddenStyle : undefined}>
                <SectionRenderer section={section} pageKey={pageData.key} whatsappNumber={ctx.config?.whatsapp_number} />
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
