import { PageHeader, PanelCard } from '@merkiai/ui'
import { getPresets } from '@/lib/presets'
import PresetForm from './PresetForm'
import PresetsBrowser from './PresetsBrowser'
import PresetImport from './PresetImport'

export const dynamic = 'force-dynamic'

export default async function PresetsPage() {
  const presets = await getPresets()

  return (
    <>
      <PageHeader
        title="Presets"
        description="Bundles curados por nicho (Tema + Template + contenido de arranque). Se aplican al crear una tienda."
      />

      <PanelCard title={`Catálogo (${presets.length})`}>
        <PresetsBrowser presets={presets} />
      </PanelCard>

      <PanelCard title="Crear / editar preset">
        <p style={{ margin: '0 0 12px', color: 'var(--ui-muted)', fontSize: 13 }}>Usa una key existente para sobrescribir un preset.</p>
        <PresetForm />
      </PanelCard>

      <PanelCard title="Importar preset desde una tienda (HU-256)">
        <p style={{ margin: '0 0 12px', color: 'var(--ui-muted)', fontSize: 13 }}>
          Sube el JSON que un comerciante exportó con «Exportar como preset» en su Constructor. Se publica con su Tema, layout y secciones del home.
        </p>
        <PresetImport />
      </PanelCard>
    </>
  )
}
