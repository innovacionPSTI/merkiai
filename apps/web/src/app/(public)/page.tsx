import { getWebHomeData } from '@merkiai/database'
import { requireStoreContext } from '@/lib/store-context'
import { getMachineDb } from '@/lib/machine-db'
import { isPreviewMode } from '@/lib/preview'
import { getHomeBlocks, getHomeLayout, type HomeSection } from '@/components/blocks/home-blocks'
import SectionShell from '@/components/sections/SectionShell'
import PreviewBanner from '@/components/PreviewBanner'

// E17/HU-157: la home lee datos del tenant resuelto por Host → render dinámico.
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  // HU-217: contexto de tienda (tenant/db/config/template) + datos del home.
  const ctx = await requireStoreContext()
  const preview = await isPreviewMode()
  // En preview se usa el cliente-máquina (is_admin) que SÍ ve filas deshabilitadas
  // (las políticas RLS *_admin_all no filtran por `enabled`); fuera de preview, el
  // cliente anon tenant-scoped (solo publicado). HU-128.
  const db = preview ? getMachineDb(ctx.tenantId) : ctx.db
  const data = await getWebHomeData(db, { preview })

  const template = ctx.template // HU-121: plantilla activa (tema) → layout
  const blocks   = getHomeBlocks(template)

  // HU-254 · render agnóstico: si la tienda tiene secciones propias en el home,
  // se recorren EN ORDEN (composición libre, varias y de cualquier tipo). Si no
  // hay ninguna (tienda recién creada), se cae al layout del template con sus
  // fallbacks. `enabled = false` oculta el bloque salvo en vista previa (HU-128).
  const hasOwnSections = data.homeSections.length > 0
  const sectionsByType = new Map(data.homeSections.map((s) => [s.section_type, s]))

  type Entry = { key: string; type: string; section?: HomeSection }
  const entries: Entry[] = hasOwnSections
    ? data.homeSections.map((s, i) => ({ key: `${s.section_type}-${s.id ?? i}`, type: s.section_type, section: s }))
    : getHomeLayout(template).map((type) => ({ key: type, type, section: sectionsByType.get(type) }))

  return (
    <>
      {preview && <PreviewBanner />}
      {entries.map(({ key, type, section }) => {
        const hidden = (section?.enabled ?? true) === false
        if (hidden && !preview) return null
        const Block = blocks[type]
        if (!Block) return null
        return (
          <div key={key} style={hidden ? { opacity: 0.55, outline: '2px dashed #d97706', outlineOffset: -2 } : undefined}>
            <SectionShell settings={section?.settings}>
              <Block section={section} data={data} template={template} />
            </SectionShell>
          </div>
        )
      })}
    </>
  )
}
