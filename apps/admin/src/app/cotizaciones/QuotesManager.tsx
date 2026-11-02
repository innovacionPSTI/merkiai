'use client'

/**
 * QuotesManager (E24 · HU-408 F2a) — lista cotizaciones, crea nuevas (líneas con
 * nombre/cantidad/precio, prellenables desde un producto) y cambia su estado.
 * La conversión a orden y el apartado con abonos son Fase 2 (orden/pagos/ledger).
 */
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface QuoteRow { id: number; quote_number: string; customer_name: string; status: string; total: number; valid_until: string | null; created_at: string | null }
interface ProductRef { id: number; name: string; price: number | null }
interface Line { name: string; qty: number; unit_price: number }

const STATUS_LABEL: Record<string, string> = { draft: 'Borrador', sent: 'Enviada', accepted: 'Aceptada', converted: 'Convertida', expired: 'Vencida', cancelled: 'Cancelada' }
const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600', sent: 'bg-blue-100 text-blue-700', accepted: 'bg-green-100 text-green-700',
  converted: 'bg-brand-primary/10 text-brand-primary', expired: 'bg-amber-100 text-amber-700', cancelled: 'bg-red-100 text-red-600',
}
const NEXT_STATES: Record<string, string[]> = {
  draft: ['sent', 'cancelled'], sent: ['accepted', 'cancelled', 'expired'], accepted: ['cancelled'], expired: [], cancelled: [], converted: [],
}
function money(n: number): string { return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n) }

export default function QuotesManager({ quotes: initial, products }: { quotes: QuoteRow[]; products: ProductRef[] }) {
  const router = useRouter()
  const [quotes, setQuotes] = useState(initial)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // alta
  const [customer, setCustomer] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [discount, setDiscount] = useState(0)
  const [lines, setLines] = useState<Line[]>([{ name: '', qty: 1, unit_price: 0 }])
  const [busy, setBusy] = useState(false)

  const subtotal = lines.reduce((s, l) => s + Math.max(0, l.qty) * Math.max(0, l.unit_price), 0)
  const total = Math.max(0, subtotal - Math.min(Math.max(0, discount), subtotal))

  async function reload() {
    const res = await fetch('/api/admin/quotes')
    if (res.ok) setQuotes((await res.json()).quotes ?? [])
  }

  function setLine(i: number, patch: Partial<Line>) { setLines((ls) => ls.map((l, idx) => idx === i ? { ...l, ...patch } : l)) }
  function addLine() { setLines((ls) => [...ls, { name: '', qty: 1, unit_price: 0 }]) }
  function removeLine(i: number) { setLines((ls) => ls.length > 1 ? ls.filter((_, idx) => idx !== i) : ls) }
  function prefill(i: number, productId: string) {
    const p = products.find((x) => x.id === Number(productId))
    if (p) setLine(i, { name: p.name, unit_price: p.price ?? 0 })
  }

  async function create() {
    const valid = lines.filter((l) => l.name.trim() && l.qty > 0)
    if (!valid.length) { setError('Agrega al menos una línea válida'); return }
    setBusy(true); setError(null)
    try {
      const res = await fetch('/api/admin/quotes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_name: customer.trim(), valid_until: validUntil || null, discount, items: valid }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error ?? 'No se pudo crear')
      setCustomer(''); setValidUntil(''); setDiscount(0); setLines([{ name: '', qty: 1, unit_price: 0 }]); setOpen(false)
      await reload()
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') } finally { setBusy(false) }
  }

  async function changeStatus(id: number, status: string) {
    const res = await fetch(`/api/admin/quotes/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    })
    if (res.ok) { await reload(); router.refresh() }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button onClick={() => setOpen((o) => !o)} className="rounded-full bg-brand-primary text-brand-cream px-5 py-2 font-brand text-sm font-medium hover:bg-brand-dark">{open ? 'Cerrar' : 'Nueva cotización'}</button>
      </div>

      {open && (
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex-1 min-w-[180px]">
              <span className="font-brand text-xs font-semibold text-brand-primary block mb-1">Cliente</span>
              <input value={customer} onChange={(e) => setCustomer(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm" />
            </label>
            <label>
              <span className="font-brand text-xs font-semibold text-brand-primary block mb-1">Vence</span>
              <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm" />
            </label>
          </div>

          <div className="space-y-2">
            {lines.map((l, i) => (
              <div key={i} className="flex flex-wrap items-end gap-2">
                <label className="flex-1 min-w-[160px]">
                  <span className="font-brand text-xs font-semibold text-brand-primary block mb-1">Concepto</span>
                  <input value={l.name} onChange={(e) => setLine(i, { name: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm" />
                </label>
                <label>
                  <span className="font-brand text-xs font-semibold text-brand-primary block mb-1">Desde producto</span>
                  <select onChange={(e) => prefill(i, e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm" defaultValue="">
                    <option value="">—</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </label>
                <label>
                  <span className="font-brand text-xs font-semibold text-brand-primary block mb-1">Cant.</span>
                  <input type="number" min={0} value={l.qty} onChange={(e) => setLine(i, { qty: Number(e.target.value) })} className="w-20 border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm" />
                </label>
                <label>
                  <span className="font-brand text-xs font-semibold text-brand-primary block mb-1">Precio</span>
                  <input type="number" min={0} value={l.unit_price} onChange={(e) => setLine(i, { unit_price: Number(e.target.value) })} className="w-28 border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm" />
                </label>
                <button onClick={() => removeLine(i)} className="font-brand text-xs text-red-500 underline pb-2">Quitar</button>
              </div>
            ))}
            <button onClick={addLine} className="font-brand text-sm text-brand-primary underline">+ Agregar línea</button>
          </div>

          <div className="flex flex-wrap items-end gap-4 border-t border-gray-100 pt-3">
            <label>
              <span className="font-brand text-xs font-semibold text-brand-primary block mb-1">Descuento</span>
              <input type="number" min={0} value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="w-28 border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm" />
            </label>
            <div className="font-brand text-sm text-brand-primary/70">Subtotal {money(subtotal)} · <strong className="text-brand-primary">Total {money(total)}</strong></div>
            <button onClick={create} disabled={busy} className="rounded-full bg-brand-primary text-brand-cream px-5 py-2 font-brand text-sm font-medium hover:bg-brand-dark disabled:opacity-50">{busy ? 'Creando…' : 'Crear cotización'}</button>
          </div>
          {error && <p className="font-brand text-sm text-red-600">{error}</p>}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm font-brand">
          <thead className="bg-slate-50 text-brand-primary/60 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Número</th>
              <th className="text-left px-4 py-3">Cliente</th>
              <th className="text-left px-4 py-3">Estado</th>
              <th className="text-right px-4 py-3">Total</th>
              <th className="text-left px-4 py-3">Vence</th>
              <th className="text-right px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {quotes.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-brand-primary/40">Aún no hay cotizaciones.</td></tr>}
            {quotes.map((q) => (
              <tr key={q.id} className="border-t border-gray-100">
                <td className="px-4 py-3 text-brand-primary font-medium">{q.quote_number}</td>
                <td className="px-4 py-3 text-brand-primary/70">{q.customer_name || '—'}</td>
                <td className="px-4 py-3"><span className={`inline-block rounded-full px-2 py-0.5 text-xs ${STATUS_STYLE[q.status] ?? ''}`}>{STATUS_LABEL[q.status] ?? q.status}</span></td>
                <td className="px-4 py-3 text-right tabular-nums text-brand-primary/70">{money(q.total)}</td>
                <td className="px-4 py-3 text-brand-primary/60">{q.valid_until ? new Date(q.valid_until).toLocaleDateString('es-CO') : '—'}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex gap-2 justify-end">
                    {(NEXT_STATES[q.status] ?? []).map((s) => (
                      <button key={s} onClick={() => changeStatus(q.id, s)} className="font-brand text-xs text-brand-primary underline">{STATUS_LABEL[s]}</button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
