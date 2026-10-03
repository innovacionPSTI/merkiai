import { PageHeader, PanelCard, StatusBadge, ResourceCard, CardGrid, Chip, EmptyState, Icon } from '@merkiai/ui'
import { getPresets } from '@/lib/presets'
import { deletePreset } from '../../actions'
import PresetForm from './PresetForm'

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
        {presets.length === 0 ? (
          <EmptyState icon={<Icon name="preset" size={28} />} title="Aún no hay presets" description="Crea el primero con el formulario de abajo." />
        ) : (
          <CardGrid>
            {presets.map((p) => (
              <ResourceCard
                key={p.key}
                title={p.name}
                badge={<StatusBadge tone={p.active ? 'success' : 'neutral'}>{p.active ? 'activo' : 'inactivo'}</StatusBadge>}
                chips={<><Chip>{p.niche}</Chip><Chip variant="neutral">{p.template}</Chip></>}
                metrics={[
                  { label: 'Inventario', value: p.inventory_model },
                  { label: 'Planes', value: p.available_in_plans.length ? p.available_in_plans.join(', ') : 'todos' },
                  { label: 'Key', value: <code>{p.key}</code> },
                ]}
                actions={
                  <form action={deletePreset}>
                    <input type="hidden" name="key" value={p.key} />
                    <button type="submit" style={{ background: 'none', border: 0, color: 'var(--ui-danger)', cursor: 'pointer', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Icon name="trash" size={15} /> Eliminar
                    </button>
                  </form>
                }
              />
            ))}
          </CardGrid>
        )}
      </PanelCard>

      <PanelCard title="Crear / editar preset">
        <p style={{ margin: '0 0 12px', color: 'var(--ui-muted)', fontSize: 13 }}>Usa una key existente para sobrescribir. Los campos JSON aceptan objeto/array.</p>
        <PresetForm />
      </PanelCard>
    </>
  )
}
