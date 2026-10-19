'use client'

import { useState } from 'react'
import { Icon } from '@merkiai/ui'

interface Comp { variant_id: number; qty: number }
interface Bundle { id: number; name: string; slug: string; price: number; active: boolean; components: Comp[] }
interface Variant { id: number; label: string }

const money = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

export default function BundlesManager({ initial, variants }: { initial: Bundle[]; variants: Variant[] }) {
  const [rows, setRows] = useState<Bundle[]>(initial)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [comps, setComps] = useState<Comp[]>([{ variant_id: variants[0]?.id ?? 0, qty: 1 }])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const label = (id: number) => variants.find((v) => v.id === id)?.label ?? `#${id}`

  function setComp(i: number, patch: Partial<Comp>) {
    setComps((c) => c.map((x, idx) => idx === i ? { ...x, ...patch } : x))
  }

  async function create(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('')
    try {
      const res = await fetch('/api/admin/bundles', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug: name, price: Number(price), components: comps.filter((c) => c.variant_id) }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error'); return }
      setRows((r) => [data.bundle, ...r]); setName(''); setPrice(''); setComps([{ variant_id: variants[0]?.id ?? 0, qty: 1 }])
    } finally { setBusy(false) }
  }
  async function toggle(b: Bundle) {
    const res = await fetch(`/api/admin/bundles/${b.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !b.active }),
    })
    if (res.ok) setRows((rs) => rs.map((x) => x.id === b.id ? { ...x, active: !x.active } : x))
  }
  async function remove(b: Bundle) {
    if (!confirm(`¿Eliminar "${b.name}"?`)) return
    const res = await fetch(`/api/admin/bundles/${b.id}`, { method: 'DELETE' })
    if (res.ok) setRows((rs) => rs.filter((x) => x.id !== b.id))
  }

  return (
    <div className="space-y-5">
      <form onSubmit={create} className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
        <p className="font-brand text-sm font-semibold text-brand-primary">Nuevo bundle</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block"><span className="font-brand text-xs text-brand-primary/50">Nombre</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required
              className="mt-1 w-full rounded-lg border border-brand-primary/15 px-3 py-2 font-brand text-sm" /></label>
          <label className="block"><span className="font-brand text-xs text-brand-primary/50">Precio del bundle</span>
            <input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} required
              className="mt-1 w-full rounded-lg border border-brand-primary/15 px-3 py-2 font-brand text-sm" /></label>
        </div>
        <div className="space-y-2">
          <span className="font-brand text-xs text-brand-primary/50">Componentes</span>
          {comps.map((c, i) => (
            <div key={i} className="flex gap-2">
              <select value={c.variant_id} onChange={(e) => setComp(i, { variant_id: Number(e.target.value) })}
                className="flex-1 rounded-lg border border-brand-primary/15 px-3 py-2 font-brand text-sm">
                {variants.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
              </select>
              <input type="number" min={1} value={c.qty} onChange={(e) => setComp(i, { qty: Number(e.target.value) || 1 })}
                className="w-20 rounded-lg border border-brand-primary/15 px-3 py-2 font-brand text-sm" />
              {comps.length > 1 && <button type="button" onClick={() => setComps((cs) => cs.filter((_, idx) => idx !== i))} className="font-brand text-xs text-red-600 px-2">✕</button>}
            </div>
          ))}
          <button type="button" onClick={() => setComps((c) => [...c, { variant_id: variants[0]?.id ?? 0, qty: 1 }])}
            className="font-brand text-xs text-brand-primary hover:underline">+ Agregar componente</button>
        </div>
        <button type="submit" disabled={busy}
          className="bg-brand-primary text-brand-cream rounded-full px-5 py-2 font-brand text-sm hover:bg-brand-dark disabled:opacity-50 inline-flex items-center gap-2">
          <Icon name="plus" size={16} /> Crear bundle
        </button>
        {error && <p className="font-brand text-sm text-red-600">{error}</p>}
      </form>

      <div className="space-y-3">
        {rows.length === 0 && <p className="font-brand text-brand-primary/40 text-center py-8">Sin bundles.</p>}
        {rows.map((b) => (
          <div key={b.id} className="bg-white rounded-2xl shadow-sm px-5 py-4 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px]">
              <p className="font-brand font-semibold text-brand-primary">{b.name} <span className="text-brand-primary/40 font-normal">· {money(b.price)}</span></p>
              <p className="font-brand text-xs text-brand-primary/40">{b.components.map((c) => `${label(c.variant_id)} ×${c.qty}`).join(' + ')}</p>
            </div>
            <button onClick={() => toggle(b)} className={`font-brand text-xs rounded-full px-2 py-1 ${b.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {b.active ? 'Activo' : 'Inactivo'}
            </button>
            <button onClick={() => remove(b)} className="font-brand text-xs text-red-600 border border-red-200 rounded-full px-3 py-1 hover:bg-red-50">Eliminar</button>
          </div>
        ))}
      </div>
    </div>
  )
}
