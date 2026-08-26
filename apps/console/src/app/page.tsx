import { requirePlatformOperator } from '@/lib/platform-auth'
import { platformDb } from '@/lib/platform-db'
import { createTenant, setTenantStatus } from './actions'

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

const box: React.CSSProperties = { border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 16 }
const input: React.CSSProperties = { padding: '6px 8px', marginRight: 8, border: '1px solid #ccc', borderRadius: 6 }
const th: React.CSSProperties = { textAlign: 'left', borderBottom: '2px solid #2E5A3B', padding: 8, fontSize: 13 }
const td: React.CSSProperties = { borderBottom: '1px solid #eee', padding: 8, fontSize: 14 }

export default async function ConsolePage() {
  const operator = await requirePlatformOperator()

  const { data } = await platformDb()
    .from('tenants')
    .select('id, name, subdomain, primary_domain, plan, data_isolation, status, created_at')
    .order('created_at', { ascending: false })
  const tenants = (data ?? []) as TenantRow[]

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: 32 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h1 style={{ color: '#2E5A3B' }}>Merkiai · Control Plane</h1>
        <span style={{ fontSize: 13, color: '#666' }}>{operator.email}</span>
      </header>

      <section style={box}>
        <h2 style={{ fontSize: 16 }}>Nuevo tenant</h2>
        <form action={createTenant}>
          <input style={input} name="name" placeholder="Nombre del negocio" required />
          <input style={input} name="subdomain" placeholder="subdominio (a-z, 0-9, -)" required />
          <button type="submit" style={{ padding: '6px 14px', background: '#2E5A3B', color: '#fff', border: 0, borderRadius: 6 }}>
            Crear
          </button>
        </form>
      </section>

      <section style={box}>
        <h2 style={{ fontSize: 16 }}>Tenants ({tenants.length})</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                <td style={td}>{t.plan}</td>
                <td style={td}>{t.data_isolation}</td>
                <td style={{ ...td, color: t.status === 'active' ? '#2E5A3B' : '#b00' }}>{t.status}</td>
                <td style={td}>
                  <form action={setTenantStatus} style={{ display: 'inline' }}>
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="status" value={t.status === 'active' ? 'suspended' : 'active'} />
                    <button type="submit" style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #ccc', background: '#fff' }}>
                      {t.status === 'active' ? 'Suspender' : 'Reactivar'}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  )
}
