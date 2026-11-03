'use client'

/**
 * TransferForm (E18·HU-181) — transfiere stock del ítem entre dos ubicaciones.
 * Anexa dos movimientos (`transfer` out/in) al libro y refresca el kardex.
 */
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function TransferForm({ itemId, uoms, locations }: {
  itemId: number
  uoms: Array<{ id: number; code: string }>
  locations: Array<{ id: number; name: string }>
}) {
  const router = useRouter()
  const [from, setFrom] = useState<number | ''>(locations[0]?.id ?? '')
  const [to, setTo] = useState<number | ''>(locations[1]?.id ?? '')
  const [qty, setQty] = useState('')
  const [uomId, setUomId] = useState<number | ''>(uoms[0]?.id ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    if (from === '' || to === '') { setError('Origen y destino requeridos'); return }
    if (from === to) { setError('El origen y el destino deben ser distintos'); return }
    if (!(Number(qty) > 0)) { setError('Cantidad (> 0) requerida'); return }
    setBusy(true); setError(null)
    try {
      const res = await fetch(`/api/admin/inventory/items/${itemId}/transfer`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_location_id: from, to_location_id: to, qty: Number(qty), uom_id: uomId === '' ? null : uomId }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error ?? 'No se pudo transferir')
      setQty(''); router.refresh()
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') } finally { setBusy(false) }
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-wrap items-end gap-3">
      <h2 className="font-display text-brand-primary text-lg w-full">Despachar transferencia</h2>
      <label>
        <span className="font-brand text-xs font-semibold text-brand-primary block mb-1">Origen</span>
        <select value={from} onChange={(e) => setFrom(e.target.value === '' ? '' : Number(e.target.value))} className="border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm">
          {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </label>
      <label>
        <span className="font-brand text-xs font-semibold text-brand-primary block mb-1">Destino</span>
        <select value={to} onChange={(e) => setTo(e.target.value === '' ? '' : Number(e.target.value))} className="border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm">
          {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
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
      <button onClick={submit} disabled={busy} className="rounded-full bg-brand-primary text-brand-cream px-5 py-2 font-brand text-sm font-medium hover:bg-brand-dark disabled:opacity-50">{busy ? 'Despachando…' : 'Despachar'}</button>
      {error && <p className="font-brand text-sm text-red-600 w-full">{error}</p>}
    </div>
  )
}
