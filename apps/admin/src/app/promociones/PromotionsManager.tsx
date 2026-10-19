'use client'

import { useState } from 'react'
import { Icon } from '@merkiai/ui'

type PromoType = 'cart_percent' | 'cart_fixed' | 'category_percent' | 'bogo'
interface Promotion {
  id: number; name: string; type: PromoType; config: any; active: boolean
  priority: number; combinable: boolean; starts_at: string | null; ends_at: string | null
}
interface Cat { id: number; name: string }

const TYPE_LABEL: Record<PromoType, string> = {
  cart_percent: '% sobre el carrito',
  cart_fixed: 'Monto fijo sobre el carrito',
  category_percent: '% en una categoría',
  bogo: 'BOGO (lleva y paga)',
}

function describe(p: Promotion, cats: Cat[]): string {
  const c = p.config ?? {}
  const cat = (id: number) => cats.find((x) => x.id === id)?.name ?? `#${id}`
  switch (p.type) {
    case 'cart_percent': return `${c.percent}% ${c.min_subtotal ? `(mín. ${c.min_subtotal})` : ''}`
    case 'cart_fixed': return `−${c.amount} ${c.min_subtotal ? `(mín. ${c.min_subtotal})` : ''}`
    case 'category_percent': return `${c.percent}% en ${cat(c.category_id)}`
    case 'bogo': return `Lleva ${(c.buy_qty ?? 1) + (c.get_qty ?? 1)}, paga ${c.buy_qty ?? 1} en ${c.product_id ? `producto #${c.product_id}` : cat(c.category_id)}`
    default: return ''
  }
}

export default function PromotionsManager({ initial, categories }: { initial: Promotion[]; categories: Cat[] }) {
  const [rows, setRows] = useState<Promotion[]>(initial)
  const [type, setType] = useState<PromoType>('cart_percent')
  const [name, setName] = useState('')
  const [combinable, setCombinable] = useState(false)
  const [cfg, setCfg] = useState<any>({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function setC(k: string, v: any) { setCfg((o: any) => ({ ...o, [k]: v === '' ? undefined : Number(v) })) }

  async function create(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('')
    try {
      const res = await fetch('/api/admin/promotions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, config: cfg, combinable }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error'); return }
      setRows((r) => [...r, data.promotion]); setName(''); setCfg({})
    } finally { setBusy(false) }
  }
  async function toggle(p: Promotion) {
    const res = await fetch(`/api/admin/promotions/${p.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !p.active }),
    })
    if (res.ok) setRows((rs) => rs.map((x) => x.id === p.id ? { ...x, active: !x.active } : x))
  }
  async function remove(p: Promotion) {
    if (!confirm(`¿Eliminar "${p.name}"?`)) return
    const res = await fetch(`/api/admin/promotions/${p.id}`, { method: 'DELETE' })
    if (res.ok) setRows((rs) => rs.filter((x) => x.id !== p.id))
  }

  const num = (k: string, label: string, props: any = {}) => (
    <label className="block"><span className="font-brand text-xs text-brand-primary/50">{label}</span>
      <input type="number" value={cfg[k] ?? ''} onChange={(e) => setC(k, e.target.value)} {...props}
        className="mt-1 w-full rounded-lg border border-brand-primary/15 px-3 py-2 font-brand text-sm" /></label>
  )
  const catSel = (k: string, label: string) => (
    <label className="block"><span className="font-brand text-xs text-brand-primary/50">{label}</span>
      <select value={cfg[k] ?? ''} onChange={(e) => setC(k, e.target.value)}
        className="mt-1 w-full rounded-lg border border-brand-primary/15 px-3 py-2 font-brand text-sm">
        <option value="">— Elige —</option>
        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select></label>
  )

  return (
    <div className="space-y-5">
      <form onSubmit={create} className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
        <p className="font-brand text-sm font-semibold text-brand-primary">Nueva promoción</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block"><span className="font-brand text-xs text-brand-primary/50">Nombre</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required
              className="mt-1 w-full rounded-lg border border-brand-primary/15 px-3 py-2 font-brand text-sm" /></label>
          <label className="block"><span className="font-brand text-xs text-brand-primary/50">Tipo</span>
            <select value={type} onChange={(e) => { setType(e.target.value as PromoType); setCfg({}) }}
              className="mt-1 w-full rounded-lg border border-brand-primary/15 px-3 py-2 font-brand text-sm">
              {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select></label>

          {type === 'cart_percent' && <>{num('percent', 'Porcentaje', { min: 1, max: 100 })}{num('min_subtotal', 'Subtotal mínimo (opcional)', { min: 0 })}</>}
          {type === 'cart_fixed' && <>{num('amount', 'Monto a descontar', { min: 1 })}{num('min_subtotal', 'Subtotal mínimo (opcional)', { min: 0 })}</>}
          {type === 'category_percent' && <>{catSel('category_id', 'Categoría')}{num('percent', 'Porcentaje', { min: 1, max: 100 })}</>}
          {type === 'bogo' && <>
            {catSel('category_id', 'Categoría objetivo (o usa producto)')}
            {num('product_id', 'ID de producto objetivo (opcional)', { min: 1 })}
            {num('buy_qty', 'Compra (N)', { min: 1 })}
            {num('get_qty', 'Gratis/descuento (M)', { min: 1 })}
            {num('percent', '% de descuento en las M (100 = gratis)', { min: 1, max: 100 })}
          </>}
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={combinable} onChange={(e) => setCombinable(e.target.checked)} className="w-4 h-4 accent-brand-primary" />
          <span className="font-brand text-sm text-brand-primary">Combinable con otras promociones (si no, es exclusiva: gana la de mayor descuento)</span>
        </label>
        <button type="submit" disabled={busy}
          className="bg-brand-primary text-brand-cream rounded-full px-5 py-2 font-brand text-sm hover:bg-brand-dark disabled:opacity-50 inline-flex items-center gap-2">
          <Icon name="plus" size={16} /> Crear promoción
        </button>
        {error && <p className="font-brand text-sm text-red-600">{error}</p>}
      </form>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="bg-gray-50 text-left font-brand text-xs text-brand-primary/50">
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Detalle</th>
              <th className="px-4 py-3">Acumula</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center font-brand text-brand-primary/40">Sin promociones.</td></tr>
            ) : rows.map((p) => (
              <tr key={p.id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-brand text-brand-primary">{p.name}</td>
                <td className="px-4 py-3 font-brand text-brand-primary/60">{TYPE_LABEL[p.type]}</td>
                <td className="px-4 py-3 font-brand text-brand-primary/70">{describe(p, categories)}</td>
                <td className="px-4 py-3 font-brand text-brand-primary/60">{p.combinable ? 'Sí' : 'Exclusiva'}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggle(p)} className={`font-brand text-xs rounded-full px-2 py-1 ${p.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.active ? 'Activa' : 'Inactiva'}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => remove(p)} className="font-brand text-xs text-red-600 border border-red-200 rounded-full px-3 py-1 hover:bg-red-50">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
