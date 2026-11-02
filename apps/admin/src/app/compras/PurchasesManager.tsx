'use client'

/**
 * PurchasesManager (E24 · HU-402) — alta de proveedores, creación de compras con
 * líneas (ítem/cantidad/unidad/costo) y **recepción** (ingresa stock con costo).
 */
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface PurchaseRow { id: number; reference: string | null; status: string; supplier: string; lines: number; total: number }
interface Opt { id: number; name: string }
interface ItemOpt { id: number; name: string; uom_id: number | null }
interface UomOpt { id: number; code: string }
interface Line { stock_item_id: number | ''; qty: string; uom_id: number | ''; unit_cost: string }

const STATUS_LABEL: Record<string, string> = { draft: 'Borrador', received: 'Recibida', cancelled: 'Cancelada' }
function money(n: number): string { return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n) }

export default function PurchasesManager({ initial, suppliers, items, uoms }: { initial: PurchaseRow[]; suppliers: Opt[]; items: ItemOpt[]; uoms: UomOpt[] }) {
  const router = useRouter()
  const [supplierId, setSupplierId] = useState<number | ''>('')
  const [reference, setReference] = useState('')
  const [lines, setLines] = useState<Line[]>([{ stock_item_id: '', qty: '', uom_id: '', unit_cost: '' }])
  const [newSupplier, setNewSupplier] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function setLine(i: number, patch: Partial<Line>) { setLines((ls) => ls.map((l, j) => j === i ? { ...l, ...patch } : l)) }

  async function addSupplier() {
    if (!newSupplier.trim()) return
    setBusy(true); setError(null)
    try {
      const res = await fetch('/api/admin/inventory/suppliers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newSupplier.trim() }) })
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error ?? 'No se pudo crear')
      setNewSupplier(''); router.refresh()
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') } finally { setBusy(false) }
  }

  async function createPurchase() {
    const valid = lines.filter((l) => l.stock_item_id !== '' && Number(l.qty) > 0)
    if (!valid.length) { setError('Agrega al menos una línea con ítem y cantidad'); return }
    setBusy(true); setError(null)
    try {
      const res = await fetch('/api/admin/inventory/purchases', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_id: supplierId === '' ? null : supplierId, reference: reference.trim() || null,
          items: valid.map((l) => ({ stock_item_id: l.stock_item_id, qty: Number(l.qty), uom_id: l.uom_id === '' ? null : l.uom_id, unit_cost: Number(l.unit_cost || 0) })),
        }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error ?? 'No se pudo crear')
      setReference(''); setLines([{ stock_item_id: '', qty: '', uom_id: '', unit_cost: '' }]); router.refresh()
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') } finally { setBusy(false) }
  }

  async function receive(id: number) {
    setBusy(true); setError(null)
    try {
      const res = await fetch(`/api/admin/inventory/purchases/${id}/receive`, { method: 'POST' })
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error ?? 'No se pudo recibir')
      router.refresh()
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') } finally { setBusy(false) }
  }

  return (
    <div className="space-y-6">
      {/* Proveedor rápido */}
      <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-wrap items-end gap-3">
        <label className="flex-1 min-w-[200px]">
          <span className="font-brand text-xs font-semibold text-brand-primary block mb-1">Nuevo proveedor</span>
          <input value={newSupplier} onChange={(e) => setNewSupplier(e.target.value)} placeholder="Nombre del proveedor"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm focus:outline-none focus:border-brand-primary" />
        </label>
        <button onClick={addSupplier} disabled={busy} className="rounded-full border border-brand-primary text-brand-primary px-4 py-2 font-brand text-sm hover:bg-brand-primary hover:text-brand-cream disabled:opacity-50">+ Proveedor</button>
      </div>

      {/* Nueva compra */}
      <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
        <h2 className="font-display text-brand-primary text-lg">Nueva compra</h2>
        <div className="flex flex-wrap gap-3">
          <label>
            <span className="font-brand text-xs font-semibold text-brand-primary block mb-1">Proveedor</span>
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value === '' ? '' : Number(e.target.value))} className="border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm">
              <option value="">—</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="flex-1 min-w-[160px]">
            <span className="font-brand text-xs font-semibold text-brand-primary block mb-1">Referencia</span>
            <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Nº factura/remisión" className="w-full border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm" />
          </label>
        </div>
        <div className="space-y-2">
          {lines.map((l, i) => (
            <div key={i} className="flex flex-wrap items-end gap-2">
              <select value={l.stock_item_id} onChange={(e) => setLine(i, { stock_item_id: e.target.value === '' ? '' : Number(e.target.value) })} className="flex-1 min-w-[180px] border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm">
                <option value="">Ítem…</option>
                {items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
              </select>
              <input value={l.qty} onChange={(e) => setLine(i, { qty: e.target.value })} type="number" min={0} step="any" placeholder="Cant." className="w-24 border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm" />
              <select value={l.uom_id} onChange={(e) => setLine(i, { uom_id: e.target.value === '' ? '' : Number(e.target.value) })} className="w-24 border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm">
                <option value="">Unidad</option>
                {uoms.map((u) => <option key={u.id} value={u.id}>{u.code}</option>)}
              </select>
              <input value={l.unit_cost} onChange={(e) => setLine(i, { unit_cost: e.target.value })} type="number" min={0} step="any" placeholder="Costo unit." className="w-32 border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm" />
              {lines.length > 1 && <button onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))} className="text-red-500 px-2">×</button>}
            </div>
          ))}
          <button onClick={() => setLines((ls) => [...ls, { stock_item_id: '', qty: '', uom_id: '', unit_cost: '' }])} className="font-brand text-sm text-brand-primary underline">+ Línea</button>
        </div>
        <button onClick={createPurchase} disabled={busy} className="rounded-full bg-brand-primary text-brand-cream px-5 py-2 font-brand text-sm font-medium hover:bg-brand-dark disabled:opacity-50">{busy ? 'Guardando…' : 'Crear compra'}</button>
        {error && <p className="font-brand text-sm text-red-600">{error}</p>}
      </div>

      {/* Listado */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm font-brand">
          <thead className="bg-slate-50 text-brand-primary/60 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Proveedor</th>
              <th className="text-left px-4 py-3">Referencia</th>
              <th className="text-center px-4 py-3">Líneas</th>
              <th className="text-right px-4 py-3">Total</th>
              <th className="text-left px-4 py-3">Estado</th>
              <th className="text-right px-4 py-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {initial.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-brand-primary/40">Sin compras.</td></tr>}
            {initial.map((p) => (
              <tr key={p.id} className="border-t border-gray-100">
                <td className="px-4 py-3">{p.supplier || '—'}</td>
                <td className="px-4 py-3 text-brand-primary/70">{p.reference || '—'}</td>
                <td className="px-4 py-3 text-center">{p.lines}</td>
                <td className="px-4 py-3 text-right tabular-nums">{money(p.total)}</td>
                <td className="px-4 py-3">{STATUS_LABEL[p.status] ?? p.status}</td>
                <td className="px-4 py-3 text-right">
                  {p.status === 'draft'
                    ? <button onClick={() => receive(p.id)} disabled={busy} className="rounded-full bg-green-600 text-white px-3 py-1.5 text-xs font-brand hover:bg-green-700 disabled:opacity-50">Recibir</button>
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
