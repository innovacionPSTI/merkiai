import { getWebHomeData } from '@merkiai/database'
import { requireStoreContext } from '@/lib/store-context'
import { getMachineDb } from '@/lib/machine-db'
import { isPreviewMode } from '@/lib/preview'
import { getHomeBlocks, getHomeLayout, type HomeSection } from '@/components/blocks/home-blocks'
import SectionShell from '@/components/sections/SectionShell'
import { groupSectionsIntoRows, cellSpanClass, cellResponsiveClasses } from '@/lib/section-rows'
import { pageStyleVars } from '@/lib/page-style'
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

  const HIDDEN = { opacity: 0.55, outline: '2px dashed #d97706', outlineOffset: -2 } as const
  const renderOne = (section: HomeSection | undefined, type: string, keyStr: string) => {
    const hidden = (section?.enabled ?? true) === false
    if (hidden && !preview) return null
    const Block = blocks[type]
    if (!Block) return null
    return (
      <div key={keyStr} className={cellResponsiveClasses(section?.settings) || undefined} style={hidden ? HIDDEN : undefined}>
        <SectionShell settings={section?.settings}>
          <Block section={section} data={data} template={template} />
        </SectionShell>
      </div>
    )
  }

  // HU-351 · en el path de secciones propias, agrupa en Filas/Columnas (opt-in).
  // Sin row_id = fila full-width (idéntico a antes). El fallback de plantilla
  // queda lineal (su layout ya lo define el preset).
  // HU-352 · estilo por página de la home (acento/contenedor/espaciado) vía
  // CSS vars; `display:contents` no genera caja → cero impacto en el layout,
  // pero las custom properties sí heredan a los bloques hijos.
  const homeStyleVars = pageStyleVars(data.homeStyle)
  return (
    <div style={{ display: 'contents', ...homeStyleVars }}>
      {preview && <PreviewBanner />}
      {hasOwnSections
        ? groupSectionsIntoRows(data.homeSections as unknown as Array<HomeSection & { id: number }>).map((row, ri) => {
            if (row.single) {
              const s = row.cells[0].section
              return renderOne(s, s.section_type, `${s.section_type}-${s.id ?? ri}`)
            }
            return (
              <div
                key={`row-${row.rowId}-${ri}`}
                className="mx-auto px-4 py-2 grid grid-cols-1 lg:grid-cols-12 items-start"
                style={{ maxWidth: 'var(--page-max, 80rem)', gap: 'var(--page-space, 1.5rem)' }}
              >
                {row.cells.map(({ section: s, span }) => {
                  const hidden = (s.enabled ?? true) === false
                  if (hidden && !preview) return null
                  const Block = blocks[s.section_type]
                  if (!Block) return null
                  return (
                    <div key={`${s.section_type}-${s.id}`} className={`${cellSpanClass(span)} ${cellResponsiveClasses(s.settings)}`.trim()} style={hidden ? HIDDEN : undefined}>
                      <SectionShell settings={s.settings}>
                        <Block section={s} data={data} template={template} />
                      </SectionShell>
                    </div>
                  )
                })}
              </div>
            )
          })
        : getHomeLayout(template).map((type) => renderOne(sectionsByType.get(type), type, type))}
    </div>
  )
}
