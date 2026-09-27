import { PageHeader, PanelCard, StatusBadge } from '@merkiai/ui'
import { getPresets } from '@/lib/presets'
import { th, td, mono, scroll } from '@/lib/styles'
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
        <div style={scroll}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 880 }}>
            <thead>
              <tr>
                <th style={th}>Key</th>
                <th style={th}>Nombre</th>
                <th style={th}>Nicho</th>
                <th style={th}>Template</th>
                <th style={th}>Inventario</th>
                <th style={th}>Planes</th>
                <th style={th}>Estado</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {presets.map((p) => (
                <tr key={p.key}>
                  <td style={{ ...td, ...mono }}>{p.key}</td>
                  <td style={td}>{p.name}</td>
                  <td style={td}>{p.niche}</td>
                  <td style={{ ...td, ...mono }}>{p.template}</td>
                  <td style={td}>{p.inventory_model}</td>
                  <td style={{ ...td, ...mono }}>{p.available_in_plans.length ? p.available_in_plans.join(', ') : 'todos'}</td>
                  <td style={td}>
                    <StatusBadge tone={p.active ? 'success' : 'neutral'}>{p.active ? 'activo' : 'inactivo'}</StatusBadge>
                  </td>
                  <td style={td}>
                    <form action={deletePreset}>
                      <input type="hidden" name="key" value={p.key} />
                      <button type="submit" style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 13 }}>
                        Eliminar
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {presets.length === 0 && (
                <tr>
                  <td style={{ ...td, color: '#888' }} colSpan={8}>Aún no hay presets. Crea el primero abajo.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </PanelCard>

      <PanelCard title="Crear / editar preset">
        <p style={{ margin: '0 0 12px', color: '#888', fontSize: 13 }}>Usa una key existente para sobrescribir. Los campos JSON aceptan objeto/array.</p>
        <PresetForm />
      </PanelCard>
    </>
  )
}
