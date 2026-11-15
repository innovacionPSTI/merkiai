import { PageHeader, PanelCard, StatCard, StatGrid, StatusBadge, EmptyState, DataTable, Chip, Icon, type BadgeTone } from '@merkiai/ui'
import { platformDb } from '@/lib/platform-db'
import { getPlans } from '@/lib/plans'
import { setTenantStatus, setTenantPlan } from '../actions'
import NewTenantForm from './new-tenant-form'
import TenantManage from './tenant-manage'
import { T } from '@merkiai/ui'
import { getConsoleTx } from '@/lib/ui-locale'

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
  owner_email: string | null
}

const statusTone = (s: string): BadgeTone => (s === 'active' ? 'success' : s === 'suspended' || s === 'canceled' ? 'danger' : 'warn')

export default async function TenantsPage() {
  const tx = await getConsoleTx()
  const [{ data }, plans] = await Promise.all([
    platformDb()
      .from('tenants')
      .select('id, name, subdomain, primary_domain, plan, data_isolation, status, created_at, owner_email')
      .order('created_at', { ascending: false }),
    getPlans(),
  ])
  const tenants = (data ?? []) as TenantRow[]
  const activos = tenants.filter((t) => t.status === 'active').length
  const suspendidos = tenants.filter((t) => t.status === 'suspended' || t.status === 'canceled').length

  return (
    <>
      <PageHeader title={tx("Tenants")} description="Alta, plan y ciclo de vida de las tiendas." />

      <StatGrid>
        <StatCard label={tx("Total tenants")} value={tenants.length} icon={<Icon name="tenant" size={20} />} />
        <StatCard label={tx("Activos")} value={activos} tone="success" icon={<Icon name="check" size={20} />} />
        <StatCard label={tx("Suspendidos")} value={suspendidos} tone="warning" icon={<Icon name="alert" size={20} />} />
        <StatCard label={tx("Planes")} value={plans.length} hint="en el catálogo" icon={<Icon name="plan" size={20} />} />
      </StatGrid>

      <PanelCard title={tx("Nuevo tenant")}>
        <NewTenantForm plans={plans.map((p) => ({ key: p.key, name: p.name }))} />
      </PanelCard>

      <PanelCard title={`Tenants (${tenants.length})`}>
        {tenants.length === 0 ? (
          <EmptyState icon={<Icon name="tenant" size={28} />} title={tx("Aún no hay tenants")} description="Crea el primero con el formulario de arriba." />
        ) : (
          <DataTable minWidth={760}>
            <thead>
              <tr>
                <th><T>Nombre</T></th>
                <th><T>Subdominio / dominio</T></th>
                <th>Dueño (super admin)</th>
                <th><T>Plan</T></th>
                <th><T>Aislamiento</T></th>
                <th><T>Estado</T></th>
                <th><T>Acción</T></th>
                <th><T>Gestión</T></th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 600 }}>{t.name}</td>
                  <td style={{ color: 'var(--ui-muted)' }}>{t.primary_domain ?? `${t.subdomain}.merkiai.com`}</td>
                  <td>{t.owner_email ?? <span style={{ color: 'var(--ui-muted)' }}><T>— sin dueño —</T></span>}</td>
                  <td>
                    <form action={setTenantPlan} style={{ display: 'flex', gap: 6 }}>
                      <input type="hidden" name="id" value={t.id} />
                      <select name="plan" defaultValue={t.plan} className="mk-input">
                        {plans.map((p) => (
                          <option key={p.key} value={p.key}>{p.name} ({p.key})</option>
                        ))}
                      </select>
                      <button type="submit" className="mk-btn mk-btn-sm"><T>Asignar</T></button>
                    </form>
                  </td>
                  <td><Chip variant="neutral">{t.data_isolation}</Chip></td>
                  <td><StatusBadge tone={statusTone(t.status)}>{t.status}</StatusBadge></td>
                  <td>
                    <form action={setTenantStatus} style={{ display: 'inline' }}>
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="status" value={t.status === 'active' ? 'suspended' : 'active'} />
                      <button type="submit" className="mk-btn-ghost mk-btn-sm">
                        {t.status === 'active' ? 'Suspender' : 'Reactivar'}
                      </button>
                    </form>
                  </td>
                  <td>
                    <TenantManage tenant={{ id: t.id, name: t.name, subdomain: t.subdomain, ownerEmail: t.owner_email }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </PanelCard>
    </>
  )
}
