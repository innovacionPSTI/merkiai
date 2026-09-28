import { PageHeader, PanelCard, StatusBadge } from '@merkiai/ui'
import { getPlans } from '@/lib/plans'
import { th, td, mono, scroll, money } from '@/lib/styles'
import { deletePlan } from '../../actions'
import PlanForm from './PlanForm'

export const dynamic = 'force-dynamic'

export default async function PlanesPage() {
  const plans = await getPlans()

  return (
    <>
      <PageHeader title="Planes" description="Catálogo de planes: funcionalidades y límites por plan." />

      <PanelCard title={`Catálogo (${plans.length})`}>
        <div style={scroll}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
            <thead>
              <tr>
                <th style={th}>Key</th>
                <th style={th}>Nombre</th>
                <th style={th}>Precio</th>
                <th style={th}>Features</th>
                <th style={th}>Límites</th>
                <th style={th}>Aislam.</th>
                <th style={th}>Estado</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.key}>
                  <td style={{ ...td, ...mono }}>{p.key}</td>
                  <td style={td}>{p.name}</td>
                  <td style={{ ...td, whiteSpace: 'nowrap' }}>{money(p.price_cents, p.currency)}</td>
                  <td style={{ ...td, ...mono }}>{JSON.stringify(p.features)}</td>
                  <td style={{ ...td, ...mono }}>{JSON.stringify(p.limits)}</td>
                  <td style={td}>{p.data_isolation}</td>
                  <td style={td}><StatusBadge tone={p.active ? 'success' : 'neutral'}>{p.active ? 'activo' : 'inactivo'}</StatusBadge></td>
                  <td style={td}>
                    <form action={deletePlan}>
                      <input type="hidden" name="key" value={p.key} />
                      <button type="submit" style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 13 }}>
                        Eliminar
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PanelCard>

      <PanelCard title="Crear / editar plan">
        <PlanForm plans={plans} />
      </PanelCard>
    </>
  )
}
