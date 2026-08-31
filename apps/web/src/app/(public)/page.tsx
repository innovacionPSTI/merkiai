import { getWebHomeData } from '@merkiai/database'
import { getStoreContext } from '@/lib/store-context'
import { getHomeBlocks, getHomeLayout } from '@/components/blocks/home-blocks'

// E17/HU-157: la home lee datos del tenant resuelto por Host → render dinámico.
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  // HU-217: contexto de tienda (tenant/db/config/template) + datos del home.
  const ctx = await getStoreContext()
  const data = await getWebHomeData(ctx.db)

  const template = ctx.config?.template ?? 'default'
  const blocks   = getHomeBlocks(template)
  const layout   = getHomeLayout(template)
  const sectionsByType = new Map(data.homeSections.map((s) => [s.section_type, s]))

  // Render data-driven: se recorre el preset del template y cada tipo se pinta
  // por el registry de bloques. Un bloque sin fila `page_sections` usa sus
  // fallbacks; `enabled = false` lo oculta.
  return (
    <>
      {layout.map((type) => {
        const section = sectionsByType.get(type)
        if ((section?.enabled ?? true) === false) return null
        const Block = blocks[type]
        return Block ? <Block key={type} section={section} data={data} template={template} /> : null
      })}
    </>
  )
}
