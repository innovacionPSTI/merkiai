import { requirePlatformOperator } from '@/lib/platform-auth'
import { platformDb } from '@/lib/platform-db'
import { getPlans } from '@/lib/plans'
import { createTenant, setTenantStatus, savePlan, setTenantPlan } from './actions'
import LogoutButton from '@/components/LogoutButton'

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
const td: React.CSSProperties = { borderBottom: '1px solid #eee', padding: 8, fontSize: 14, verticalAlign: 'top' }
const btn: React.CSSProperties = { padding: '6px 14px', background: '#2E5A3B', color: '#fff', border: 0, borderRadius: 6 }
const mono: React.CSSProperties = { fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-wrap' }
const money = (cents: number, currency: string) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency, maximumFractionDigits: 0 }).format(cents / 100)

export default async function ConsolePage() {
  const operator = await requirePlatformOperator()

  const [{ data: tenantsData }, plans] = await Promise.all([
    platformDb()
      .from('tenants')
      .select('id, name, subdomain, primary_domain, plan, data_isolation, status, created_at')
      .order('created_at', { ascending: false }),
    getPlans(),
  ])
  const tenants = (tenantsData ?? []) as TenantRow[]

  return (
    <>
      <style>{`
        .cw-shell { display: grid; grid-template-columns: 200px 1fr; gap: 24px; max-width: 1120px; margin: 0 auto; padding: 24px; }
        .cw-nav a { display: block; padding: 8px 10px; border-radius: 6px; color: #2E5A3B; text-decoration: none; font-size: 14px; }
        .cw-nav a:hover { background: #eef3ef; }
        .cw-nav a.disabled { color: #aaa; pointer-events: none; }
        @media (max-width: 760px) { .cw-shell { grid-template-columns: 1fr; } .cw-side { display: none; } }
      `}</style>

      <div style={{ borderBottom: '1px solid #eee', background: '#fff', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style={{ color: '#2E5A3B', fontSize: 18 }}>Merkiai · Control Plane</strong>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#666' }}>{operator.email}</span>
            <LogoutButton />
          </div>
        </div>
      </div>

      <div className="cw-shell">
        <aside className="cw-side">
          <nav className="cw-nav" style={{ position: 'sticky', top: 72 }}>
            <a href="#tenants">Tenants</a>
            <a href="#planes">Planes</a>
            <a className="disabled" href="#" title="Próximamente">Dominios</a>
            <a className="disabled" href="#" title="Próximamente">Auditoría</a>
          </nav>
        </aside>

        <div>
      <section style={box}>
        <h2 style={{ fontSize: 16 }}>Nuevo tenant</h2>
        <form action={createTenant}>
          <input style={input} name="name" placeholder="Nombre del negocio" required />
          <input style={input} name="subdomain" placeholder="subdominio (a-z, 0-9, -)" required />
          <button type="submit" style={btn}>Crear</button>
        </form>
      </section>

      <section id="tenants" style={box}>
        <h2 style={{ fontSize: 16 }}>Tenants ({tenants.length})</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Nombre</th>
              <th style={th}>Subdominio / dominio</th>
              <th style={th}>Plan</th>
              <th style={th}>Aislamiento</th>
              <th style={th}>Estado</th>
              <th style={th}>Acciones</th>
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

      <section id="planes" style={box}>
        <h2 style={{ fontSize: 16 }}>Planes ({plans.length})</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
          <thead>
            <tr>
              <th style={th}>Key</th>
              <th style={th}>Nombre</th>
              <th style={th}>Precio</th>
              <th style={th}>Features</th>
              <th style={th}>Límites</th>
              <th style={th}>Aislam.</th>
              <th style={th}>Activo</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.key}>
                <td style={{ ...td, ...mono }}>{p.key}</td>
                <td style={td}>{p.name}</td>
                <td style={td}>{money(p.price_cents, p.currency)}</td>
                <td style={{ ...td, ...mono }}>{JSON.stringify(p.features)}</td>
                <td style={{ ...td, ...mono }}>{JSON.stringify(p.limits)}</td>
                <td style={td}>{p.data_isolation}</td>
                <td style={td}>{p.active ? 'sí' : 'no'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 style={{ fontSize: 14 }}>Crear / editar plan <span style={{ color: '#888', fontWeight: 400 }}>(usa una key existente para sobrescribir)</span></h3>
        <form action={savePlan} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxWidth: 760 }}>
          <input style={input} name="key" placeholder="key (p.ej. pro)" required />
          <input style={input} name="name" placeholder="Nombre visible" required />
          <input style={input} name="price_cents" type="number" min={0} placeholder="precio en centavos" defaultValue={0} />
          <input style={input} name="currency" placeholder="COP" defaultValue="COP" />
          <textarea style={{ ...input, ...mono, gridColumn: '1 / span 2', minHeight: 56 }} name="features" placeholder='{"pos": true, "ai": false}' />
          <textarea style={{ ...input, ...mono, gridColumn: '1 / span 2', minHeight: 56 }} name="limits" placeholder='{"products": 2000, "users": 10}' />
          <select style={input} name="data_isolation" defaultValue="shared">
            <option value="shared">shared</option>
            <option value="schema">schema</option>
            <option value="dedicated">dedicated</option>
          </select>
          <select style={input} name="active" defaultValue="true">
            <option value="true">activo</option>
            <option value="false">inactivo</option>
          </select>
          <button type="submit" style={{ ...btn, gridColumn: '1 / span 2' }}>Guardar plan</button>
        </form>
      </section>
        </div>
      </div>
    </>
  )
}
