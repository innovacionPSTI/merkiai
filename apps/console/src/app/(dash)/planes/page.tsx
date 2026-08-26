import { getPlans } from '@/lib/plans'
import { box, input, th, td, btn, mono, scroll, money } from '@/lib/styles'
import { savePlan } from '../../actions'

export const dynamic = 'force-dynamic'

export default async function PlanesPage() {
  const plans = await getPlans()

  return (
    <>
      <h1 style={{ color: '#2E5A3B', fontSize: 22, marginTop: 0 }}>Planes</h1>

      <section style={box}>
        <h2 style={{ fontSize: 16 }}>Catálogo ({plans.length})</h2>
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
                <th style={th}>Activo</th>
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
                  <td style={td}>{p.active ? 'sí' : 'no'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={box}>
        <h2 style={{ fontSize: 16 }}>
          Crear / editar plan <span style={{ color: '#888', fontWeight: 400, fontSize: 13 }}>(usa una key existente para sobrescribir)</span>
        </h2>
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
    </>
  )
}
