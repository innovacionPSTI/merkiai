import { PageHeader, PanelCard, StatCard, StatGrid, StatusBadge, EmptyState, type BadgeTone } from '@merkiai/ui'
import { platformDb } from '@/lib/platform-db'
import { getPlans } from '@/lib/plans'
import { input, btn, th, td, scroll } from '@/lib/styles'
import { setTenantStatus, setTenantPlan } from '../actions'
import NewTenantForm from './new-tenant-form'

export const dynamic = 'force-dynamic'

interface TenantRow {
  id: string
  name: string
  subdomain: string | null
  primary_domain: string | null
  plan: string
  data_isolation: string
  status: string
  created_at: string
}

const statusTone = (s: string): BadgeTone => (s === 'active' ? 'success' : s === 'suspended' || s === 'canceled' ? 'danger' : 'warn')

export default async function TenantsPage() {
  const [{ data }, plans] = await Promise.all([
    platformDb()
      .from('tenants')
      .select('id, name, subdomain, primary_domain, plan, data_isolation, status, created_at')
      .order('created_at', { ascending: false }),
    getPlans(),
  ])
  const tenants = (data ?? []) as TenantRow[]
  const activos = tenants.filter((t) => t.status === 'active').length
  const suspendidos = tenants.filter((t) => t.status === 'suspended' || t.status === 'canceled').length

  return (
    <>
      <PageHeader title="Tenants" description="Alta, plan y ciclo de vida de las tiendas." />

      <StatGrid>
        <StatCard label="Total tenants" value={tenants.length} />
        <StatCard label="Activos" value={activos} />
        <StatCard label="Suspendidos" value={suspendidos} />
        <StatCard label="Planes" value={plans.length} hint="en el catálogo" />
      </StatGrid>

      <PanelCard title="Nuevo tenant">
        <NewTenantForm plans={plans.map((p) => ({ key: p.key, name: p.name }))} />
      </PanelCard>

      <PanelCard title={`Tenants (${tenants.length})`}>
        {tenants.length === 0 ? (
          <EmptyState icon="🏬" title="Aún no hay tenants" description="Crea el primero con el formulario de arriba." />
        ) : (
          <div style={scroll}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
              <thead>
                <tr>
                  <th style={th}>Nombre</th>
                  <th style={th}>Subdominio / dominio</th>
                  <th style={th}>Plan</th>
                  <th style={th}>Aislamiento</th>
                  <th style={th}>Estado</th>
                  <th style={th}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t) => (
                  <tr key={t.id}>
                    <td style={td}>{t.name}</td>
                    <td style={td}>{t.primary_domain ?? `${t.subdomain}.merkiai.com`}</td>
                    <td style={td}>
                      <form action={setTenantPlan} style={{ display: 'flex', gap: 6 }}>
                        <input type="hidden" name="id" value={t.id} />
                        <select name="plan" defaultValue={t.plan} style={input}>
                          {plans.map((p) => (
                            <option key={p.key} value={p.key}>{p.name} ({p.key})</option>
                          ))}
                        </select>
                        <button type="submit" style={{ ...btn, padding: '4px 10px' }}>Asignar</button>
                      </form>
                    </td>
                    <td style={td}>{t.data_isolation}</td>
                    <td style={td}><StatusBadge tone={statusTone(t.status)}>{t.status}</StatusBadge></td>
                    <td style={td}>
                      <form action={setTenantStatus} style={{ display: 'inline' }}>
                        <input type="hidden" name="id" value={t.id} />
                        <input type="hidden" name="status" value={t.status === 'active' ? 'suspended' : 'active'} />
                        <button type="submit" style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}>
                          {t.status === 'active' ? 'Suspender' : 'Reactivar'}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PanelCard>
    </>
  )
}
