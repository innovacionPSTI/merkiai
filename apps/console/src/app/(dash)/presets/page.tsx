import { PageHeader, PanelCard } from '@merkiai/ui'
import { getPresets } from '@/lib/presets'
import PresetForm from './PresetForm'
import PresetsBrowser from './PresetsBrowser'

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
        <p style={{ margin: '0 0 12px', color: 'var(--ui-muted)', fontSize: 13 }}>Usa una key existente para sobrescribir. Los campos JSON aceptan objeto/array.</p>
        <PresetForm />
      </PanelCard>
    </>
  )
}
