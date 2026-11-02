'use client'

/**
 * AdjustForm (E24 · HU-401) — ajuste manual de stock de un ítem. Anexa un
 * movimiento de ajuste (entrada/salida) al libro y refresca el kardex.
 */
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdjustForm({ itemId, uoms }: { itemId: number; uoms: Array<{ id: number; code: string }> }) {
  const router = useRouter()
  const [direction, setDirection] = useState<'in' | 'out'>('in')
  const [qty, setQty] = useState('')
  const [uomId, setUomId] = useState<number | ''>(uoms[0]?.id ?? '')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    if (!(Number(qty) > 0)) { setError('Cantidad (> 0) requerida'); return }
    setBusy(true); setError(null)
    try {
      const res = await fetch(`/api/admin/inventory/items/${itemId}/adjust`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction, qty: Number(qty), uom_id: uomId === '' ? null : uomId, reason: reason.trim() || null }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error ?? 'No se pudo ajustar')
      setQty(''); setReason(''); router.refresh()
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') } finally { setBusy(false) }
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-wrap items-end gap-3">
      <h2 className="font-display text-brand-primary text-lg w-full">Ajuste manual</h2>
      <label>
        <span className="font-brand text-xs font-semibold text-brand-primary block mb-1">Tipo</span>
        <select value={direction} onChange={(e) => setDirection(e.target.value as 'in' | 'out')} className="border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm">
          <option value="in">Entrada (+)</option>
          <option value="out">Salida (−)</option>
        </select>
      </label>
      <label>
        <span className="font-brand text-xs font-semibold text-brand-primary block mb-1">Cantidad</span>
        <input value={qty} onChange={(e) => setQty(e.target.value)} type="number" min={0} step="any" className="w-28 border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm" />
      </label>
      <label>
        <span className="font-brand text-xs font-semibold text-brand-primary block mb-1">Unidad</span>
        <select value={uomId} onChange={(e) => setUomId(e.target.value === '' ? '' : Number(e.target.value))} className="border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm">
          <option value="">—</option>
          {uoms.map((u) => <option key={u.id} value={u.id}>{u.code}</option>)}
        </select>
      </label>
      <label className="flex-1 min-w-[160px]">
        <span className="font-brand text-xs font-semibold text-brand-primary block mb-1">Motivo</span>
        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ej. conteo físico, saldo inicial" className="w-full border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm" />
      </label>
      <button onClick={submit} disabled={busy} className="rounded-full bg-brand-primary text-brand-cream px-5 py-2 font-brand text-sm font-medium hover:bg-brand-dark disabled:opacity-50">{busy ? 'Aplicando…' : 'Aplicar ajuste'}</button>
      {error && <p className="font-brand text-sm text-red-600 w-full">{error}</p>}
    </div>
  )
}
