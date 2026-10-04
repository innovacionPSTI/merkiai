import { getWebHomeData } from '@merkiai/database'
import { requireStoreContext } from '@/lib/store-context'
import { isPreviewMode } from '@/lib/preview'
import { getHomeBlocks, getHomeLayout } from '@/components/blocks/home-blocks'
import PreviewBanner from '@/components/PreviewBanner'

// E17/HU-157: la home lee datos del tenant resuelto por Host → render dinámico.
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  // HU-217: contexto de tienda (tenant/db/config/template) + datos del home.
  const ctx = await requireStoreContext()
  const preview = await isPreviewMode()
  const data = await getWebHomeData(ctx.db, { preview })

  const template = ctx.config?.template ?? 'default'
  const blocks   = getHomeBlocks(template)
  const layout   = getHomeLayout(template)
  const sectionsByType = new Map(data.homeSections.map((s) => [s.section_type, s]))

  // Render data-driven: se recorre el preset del template y cada tipo se pinta
  // por el registry de bloques. Un bloque sin fila `page_sections` usa sus
  // fallbacks; `enabled = false` lo oculta — salvo en vista previa (HU-128),
  // donde se muestra para que el comerciante vea el borrador.
  return (
    <>
      {preview && <PreviewBanner />}
      {layout.map((type) => {
        const section = sectionsByType.get(type)
        const hidden = (section?.enabled ?? true) === false
        if (hidden && !preview) return null
        const Block = blocks[type]
        if (!Block) return null
        return (
          <div key={type} style={hidden ? { opacity: 0.55, outline: '2px dashed #d97706', outlineOffset: -2 } : undefined}>
            <Block section={section} data={data} template={template} />
          </div>
        )
      })}
    </>
  )
}
