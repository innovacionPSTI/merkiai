import { PageHeader, PanelCard, StatusBadge, ResourceCard, CardGrid, Chip, EmptyState, Icon } from '@merkiai/ui'
import { getPlans } from '@/lib/plans'
import { money } from '@/lib/styles'
import { deletePlan } from '../../actions'
import PlanForm from './PlanForm'

export const dynamic = 'force-dynamic'

export default async function PlanesPage() {
  const plans = await getPlans()

  return (
    <>
      <PageHeader title="Planes" description="Catálogo de planes: funcionalidades y límites por plan." />

      <PanelCard title={`Catálogo (${plans.length})`}>
        {plans.length === 0 ? (
          <EmptyState icon={<Icon name="plan" size={28} />} title="Aún no hay planes" description="Crea el primero con el formulario de abajo." />
        ) : (
          <CardGrid min={300}>
            {plans.map((p) => {
              const features = Object.entries(p.features).filter(([, v]) => v === true).map(([k]) => k)
              return (
                <ResourceCard
                  key={p.key}
                  title={p.name}
                  badge={<StatusBadge tone={p.active ? 'success' : 'neutral'}>{p.active ? 'activo' : 'inactivo'}</StatusBadge>}
                  chips={features.length ? features.map((f) => <Chip key={f}>{f}</Chip>) : <Chip variant="neutral">sin features</Chip>}
                  price={money(p.price_cents, p.currency)}
                  priceSuffix="/mes"
                  metrics={[
                    { label: 'Aislamiento', value: p.data_isolation },
                    { label: 'Límites', value: `${Object.keys(p.limits).length} definidos` },
                    { label: 'Key', value: <code>{p.key}</code> },
                  ]}
                  actions={
                    <form action={deletePlan}>
                      <input type="hidden" name="key" value={p.key} />
                      <button type="submit" style={{ background: 'none', border: 0, color: 'var(--ui-danger)', cursor: 'pointer', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Icon name="trash" size={15} /> Eliminar
                      </button>
                    </form>
                  }
                />
              )
            })}
          </CardGrid>
        )}
      </PanelCard>

      <PanelCard title="Crear / editar plan">
        <PlanForm plans={plans} />
      </PanelCard>
    </>
  )
}
