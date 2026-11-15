import { PageHeader, PanelCard } from '@merkiai/ui'
import { getPresets } from '@/lib/presets'
import PresetForm from './PresetForm'
import PresetsBrowser from './PresetsBrowser'
import PresetImport from './PresetImport'
import { T } from '@merkiai/ui'
import { getConsoleTx } from '@/lib/ui-locale'

export const dynamic = 'force-dynamic'

export default async function PresetsPage() {
  const tx = await getConsoleTx()
  const presets = await getPresets()

  return (
    <>
      <PageHeader
        title={tx("Presets")}
        description="Bundles curados por nicho (Tema + Template + contenido de arranque). Se aplican al crear una tienda."
      />

      <PanelCard title={`Catálogo (${presets.length})`}>
        <PresetsBrowser presets={presets} />
      </PanelCard>

      <PanelCard title={tx("Crear / editar preset")}>
        <p style={{ margin: '0 0 12px', color: 'var(--ui-muted)', fontSize: 13 }}><T>Usa una key existente para sobrescribir un preset.</T></p>
        <PresetForm />
      </PanelCard>

      <PanelCard title={tx("Importar preset desde una tienda (HU-256)")}>
        <p style={{ margin: '0 0 12px', color: 'var(--ui-muted)', fontSize: 13 }}>
          <T>Sube el JSON que un comerciante exportó con «Exportar como preset» en su Constructor. Se publica con su Tema, layout y secciones del home.</T>
        </p>
        <PresetImport />
      </PanelCard>
    </>
  )
}
