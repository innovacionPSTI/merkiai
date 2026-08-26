import { platformDb } from '@/lib/platform-db'
import { getPlans } from '@/lib/plans'
import { box, input, th, td, btn, scroll } from '@/lib/styles'
import { createTenant, setTenantStatus, setTenantPlan } from '../actions'

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

export default async function TenantsPage() {
  const [{ data }, plans] = await Promise.all([
    platformDb()
      .from('tenants')
      .select('id, name, subdomain, primary_domain, plan, data_isolation, status, created_at')
      .order('created_at', { ascending: false }),
    getPlans(),
  ])
  const tenants = (data ?? []) as TenantRow[]

  return (
    <>
      <h1 style={{ color: '#2E5A3B', fontSize: 22, marginTop: 0 }}>Tenants</h1>

      <section style={box}>
        <h2 style={{ fontSize: 16 }}>Nuevo tenant</h2>
        <form action={createTenant} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <input style={input} name="name" placeholder="Nombre del negocio" required />
          <input style={input} name="subdomain" placeholder="subdominio (a-z, 0-9, -)" required />
          <button type="submit" style={btn}>Crear</button>
        </form>
      </section>

      <section style={box}>
        <h2 style={{ fontSize: 16 }}>Tenants ({tenants.length})</h2>
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
                  <td style={{ ...td, color: t.status === 'active' ? '#2E5A3B' : '#b00' }}>{t.status}</td>
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
      </section>
    </>
  )
}
