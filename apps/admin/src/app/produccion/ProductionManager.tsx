'use client'

/**
 * ProductionManager (E24 · HU-404/405) — define recetas (BOM) y gestiona órdenes
 * de producción: crear y **completar** (consume insumos, crea terminado con costo).
 */
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ItemOpt { id: number; name: string; uom_id: number | null }
interface UomOpt { id: number; code: string }
interface BomRow { id: number; output: string; policy: string; yield_qty: number; name: string | null }
interface OrderRow { id: number; output: string; planned: number; produced: number | null; status: string }
interface CompLine { component_stock_item_id: number | ''; qty: string; uom_id: number | '' }

const POLICY_LABEL: Record<string, string> = { al_vender: 'Al vender', al_producir: 'Al producir' }
const STATUS_LABEL: Record<string, string> = { draft: 'Borrador', completed: 'Completada', cancelled: 'Cancelada' }
function fmt(n: number): string { return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 3 }).format(n) }

export default function ProductionManager({ items, uoms, boms, orders }: { items: ItemOpt[]; uoms: UomOpt[]; boms: BomRow[]; orders: OrderRow[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Receta
  const [output, setOutput] = useState<number | ''>('')
  const [policy, setPolicy] = useState('al_producir')
  const [yieldQty, setYieldQty] = useState('1')
  const [comps, setComps] = useState<CompLine[]>([{ component_stock_item_id: '', qty: '', uom_id: '' }])

  // Orden
  const [orderOutput, setOrderOutput] = useState<number | ''>('')
  const [plannedQty, setPlannedQty] = useState('')

  function setComp(i: number, patch: Partial<CompLine>) { setComps((cs) => cs.map((c, j) => j === i ? { ...c, ...patch } : c)) }

  async function post(url: string, body: unknown): Promise<void> {
    setBusy(true); setError(null)
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error ?? 'Error')
      router.refresh()
    } catch (e) { setError(e instanceof Error ? e.message : 'Error'); throw e } finally { setBusy(false) }
  }

  async function createBom() {
    const valid = comps.filter((c) => c.component_stock_item_id !== '' && Number(c.qty) > 0)
    if (output === '' || !valid.length) { setError('Elige el ítem de salida y al menos un componente'); return }
    try {
      await post('/api/admin/inventory/boms', {
        output_stock_item_id: output, consumption_policy: policy, yield_qty: Number(yieldQty || 1),
        components: valid.map((c) => ({ component_stock_item_id: c.component_stock_item_id, qty: Number(c.qty), uom_id: c.uom_id === '' ? null : c.uom_id })),
      })
      setComps([{ component_stock_item_id: '', qty: '', uom_id: '' }]); setOutput('')
    } catch { /* error ya mostrado */ }
  }

  async function createOrder() {
    if (orderOutput === '' || !(Number(plannedQty) > 0)) { setError('Elige el producto y la cantidad a producir'); return }
    try { await post('/api/admin/inventory/production', { output_stock_item_id: orderOutput, planned_qty: Number(plannedQty) }); setPlannedQty('') }
    catch { /* error ya mostrado */ }
  }

  async function complete(id: number) {
    try { await post(`/api/admin/inventory/production/${id}/complete`, {}) } catch { /* error ya mostrado */ }
  }

  return (
    <div className="space-y-6">
      {/* Receta */}
      <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
        <h2 className="font-display text-brand-primary text-lg">Nueva receta</h2>
        <div className="flex flex-wrap gap-3">
          <label>
            <span className="font-brand text-xs font-semibold text-brand-primary block mb-1">Producto de salida</span>
            <select value={output} onChange={(e) => setOutput(e.target.value === '' ? '' : Number(e.target.value))} className="border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm">
              <option value="">—</option>
              {items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
            </select>
          </label>
          <label>
            <span className="font-brand text-xs font-semibold text-brand-primary block mb-1">Política</span>
            <select value={policy} onChange={(e) => setPolicy(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm">
              <option value="al_producir">Al producir (café/manufactura)</option>
              <option value="al_vender">Al vender (restaurante)</option>
            </select>
          </label>
          <label>
            <span className="font-brand text-xs font-semibold text-brand-primary block mb-1">Rinde</span>
            <input value={yieldQty} onChange={(e) => setYieldQty(e.target.value)} type="number" min={0} step="any" className="w-24 border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm" />
          </label>
        </div>
        <div className="space-y-2">
          {comps.map((c, i) => (
            <div key={i} className="flex flex-wrap items-end gap-2">
              <select value={c.component_stock_item_id} onChange={(e) => setComp(i, { component_stock_item_id: e.target.value === '' ? '' : Number(e.target.value) })} className="flex-1 min-w-[180px] border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm">
                <option value="">Componente…</option>
                {items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
              </select>
              <input value={c.qty} onChange={(e) => setComp(i, { qty: e.target.value })} type="number" min={0} step="any" placeholder="Cant." className="w-24 border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm" />
              <select value={c.uom_id} onChange={(e) => setComp(i, { uom_id: e.target.value === '' ? '' : Number(e.target.value) })} className="w-24 border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm">
                <option value="">Unidad</option>
                {uoms.map((u) => <option key={u.id} value={u.id}>{u.code}</option>)}
              </select>
              {comps.length > 1 && <button onClick={() => setComps((cs) => cs.filter((_, j) => j !== i))} className="text-red-500 px-2">×</button>}
            </div>
          ))}
          <button onClick={() => setComps((cs) => [...cs, { component_stock_item_id: '', qty: '', uom_id: '' }])} className="font-brand text-sm text-brand-primary underline">+ Componente</button>
        </div>
        <button onClick={createBom} disabled={busy} className="rounded-full bg-brand-primary text-brand-cream px-5 py-2 font-brand text-sm font-medium hover:bg-brand-dark disabled:opacity-50">Guardar receta</button>
      </div>

      {/* Recetas existentes */}
      {boms.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="font-display text-brand-primary mb-2">Recetas</h3>
          <ul className="space-y-1 font-brand text-sm">
            {boms.map((b) => <li key={b.id} className="text-brand-primary/70">{b.output} · {POLICY_LABEL[b.policy] ?? b.policy} · rinde {fmt(b.yield_qty)}</li>)}
          </ul>
        </div>
      )}

      {/* Nueva orden */}
      <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-wrap items-end gap-3">
        <label>
          <span className="font-brand text-xs font-semibold text-brand-primary block mb-1">Producir</span>
          <select value={orderOutput} onChange={(e) => setOrderOutput(e.target.value === '' ? '' : Number(e.target.value))} className="border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm">
            <option value="">—</option>
            {items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
          </select>
        </label>
        <label>
          <span className="font-brand text-xs font-semibold text-brand-primary block mb-1">Cantidad</span>
          <input value={plannedQty} onChange={(e) => setPlannedQty(e.target.value)} type="number" min={0} step="any" className="w-28 border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm" />
        </label>
        <button onClick={createOrder} disabled={busy} className="rounded-full border border-brand-primary text-brand-primary px-4 py-2 font-brand text-sm hover:bg-brand-primary hover:text-brand-cream disabled:opacity-50">Crear orden</button>
        {error && <p className="font-brand text-sm text-red-600 w-full">{error}</p>}
      </div>

      {/* Órdenes */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm font-brand">
          <thead className="bg-slate-50 text-brand-primary/60 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Producto</th>
              <th className="text-right px-4 py-3">Planificado</th>
              <th className="text-right px-4 py-3">Producido</th>
              <th className="text-left px-4 py-3">Estado</th>
              <th className="text-right px-4 py-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-brand-primary/40">Sin órdenes.</td></tr>}
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-gray-100">
                <td className="px-4 py-3">{o.output}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmt(o.planned)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{o.produced == null ? '—' : fmt(o.produced)}</td>
                <td className="px-4 py-3">{STATUS_LABEL[o.status] ?? o.status}</td>
                <td className="px-4 py-3 text-right">
                  {o.status === 'draft'
                    ? <button onClick={() => complete(o.id)} disabled={busy} className="rounded-full bg-green-600 text-white px-3 py-1.5 text-xs font-brand hover:bg-green-700 disabled:opacity-50">Completar</button>
                    : <span className="text-brand-primary/30 text-xs">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
