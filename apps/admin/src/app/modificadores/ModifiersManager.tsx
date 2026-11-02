'use client'

/**
 * ModifiersManager (E24 · HU-406) — gestiona grupos de modificadores y sus
 * opciones por producto. Selecciona un producto, agrega grupos (con reglas de
 * selección mín/máx/obligatorio) y opciones (con ajuste de precio y consumo
 * opcional de inventario al venderse). El descuento real se aplica en la venta.
 */
import { useState } from 'react'

interface Option { id: number; name: string; price_delta: number; consume_stock_item_id: number | null; consume_qty: number | null; consume_uom_id: number | null }
interface Group { id: number; name: string; min_select: number; max_select: number; required: boolean; options: Option[] }
interface ItemRef { id: number; name: string; uom_id: number | null }
interface UomRef { id: number; code: string }

function money(n: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}

export default function ModifiersManager({ products, items, uoms }: {
  products: Array<{ id: number; name: string }>
  items: ItemRef[]
  uoms: UomRef[]
}) {
  const [productId, setProductId] = useState<number | ''>('')
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // alta de grupo
  const [gName, setGName] = useState('')
  const [gMin, setGMin] = useState(0)
  const [gMax, setGMax] = useState(0)
  const [gReq, setGReq] = useState(false)
  const [gBusy, setGBusy] = useState(false)

  const itemName = new Map(items.map((i) => [i.id, i.name]))
  const uomCode = new Map(uoms.map((u) => [u.id, u.code]))

  async function loadGroups(id: number) {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/admin/inventory/modifiers?product_id=${id}`)
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error ?? 'No se pudo cargar')
      setGroups((await res.json()).groups ?? [])
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') } finally { setLoading(false) }
  }

  function onSelectProduct(v: string) {
    const id = v === '' ? '' : Number(v)
    setProductId(id)
    setGroups([])
    if (id !== '') loadGroups(id)
  }

  async function addGroup() {
    if (productId === '' || !gName.trim()) { setError('Selecciona producto y nombre del grupo'); return }
    setGBusy(true); setError(null)
    try {
      const res = await fetch('/api/admin/inventory/modifiers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, name: gName.trim(), min_select: gMin, max_select: gMax, required: gReq }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error ?? 'No se pudo crear')
      setGName(''); setGMin(0); setGMax(0); setGReq(false)
      await loadGroups(productId)
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') } finally { setGBusy(false) }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <label className="block max-w-md">
          <span className="font-brand text-xs font-semibold text-brand-primary block mb-1">Producto</span>
          <select value={productId} onChange={(e) => onSelectProduct(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm">
            <option value="">Selecciona un producto…</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
      </div>

      {error && <p className="font-brand text-sm text-red-600">{error}</p>}

      {productId !== '' && (
        <>
          <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
            <h2 className="font-display text-brand-primary text-lg">Nuevo grupo</h2>
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex-1 min-w-[180px]">
                <span className="font-brand text-xs font-semibold text-brand-primary block mb-1">Nombre (p. ej. Tamaño, Extras)</span>
                <input value={gName} onChange={(e) => setGName(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm" />
              </label>
              <label>
                <span className="font-brand text-xs font-semibold text-brand-primary block mb-1">Mín.</span>
                <input type="number" min={0} value={gMin} onChange={(e) => setGMin(Number(e.target.value))} className="w-20 border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm" />
              </label>
              <label>
                <span className="font-brand text-xs font-semibold text-brand-primary block mb-1">Máx. (0 = sin tope)</span>
                <input type="number" min={0} value={gMax} onChange={(e) => setGMax(Number(e.target.value))} className="w-28 border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm" />
              </label>
              <label className="flex items-center gap-2 font-brand text-sm text-brand-primary">
                <input type="checkbox" checked={gReq} onChange={(e) => setGReq(e.target.checked)} /> Obligatorio
              </label>
              <button onClick={addGroup} disabled={gBusy} className="rounded-full bg-brand-primary text-brand-cream px-5 py-2 font-brand text-sm font-medium hover:bg-brand-dark disabled:opacity-50">{gBusy ? 'Agregando…' : 'Agregar grupo'}</button>
            </div>
          </div>

          {loading && <p className="font-brand text-sm text-brand-primary/50">Cargando…</p>}
          {!loading && groups.length === 0 && <p className="font-brand text-sm text-brand-primary/40">Este producto aún no tiene grupos de modificadores.</p>}

          {groups.map((g) => (
            <GroupCard key={g.id} group={g} items={items} uoms={uoms} itemName={itemName} uomCode={uomCode} onChanged={() => loadGroups(productId)} />
          ))}
        </>
      )}
    </div>
  )
}

function GroupCard({ group, items, uoms, itemName, uomCode, onChanged }: {
  group: Group; items: ItemRef[]; uoms: UomRef[]
  itemName: Map<number, string>; uomCode: Map<number, string>; onChanged: () => void
}) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState(0)
  const [consume, setConsume] = useState<number | ''>('')
  const [qty, setQty] = useState<number | ''>('')
  const [uomId, setUomId] = useState<number | ''>('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function addOption() {
    if (!name.trim()) { setErr('Nombre requerido'); return }
    setBusy(true); setErr(null)
    try {
      const res = await fetch('/api/admin/inventory/modifiers/options', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group_id: group.id, name: name.trim(), price_delta: price,
          consume_stock_item_id: consume === '' ? null : consume,
          consume_qty: qty === '' ? null : qty,
          consume_uom_id: uomId === '' ? null : uomId,
        }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error ?? 'No se pudo crear')
      setName(''); setPrice(0); setConsume(''); setQty(''); setUomId('')
      onChanged()
    } catch (e) { setErr(e instanceof Error ? e.message : 'Error') } finally { setBusy(false) }
  }

  const rule = group.required ? 'Obligatorio' : 'Opcional'
  const range = `${group.min_select}–${group.max_select === 0 ? '∞' : group.max_select}`

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-brand-primary text-lg">{group.name}</h3>
        <span className="font-brand text-xs text-brand-primary/50">{rule} · selecciona {range}</span>
      </div>

      <table className="w-full text-sm font-brand">
        <thead className="text-brand-primary/50 text-xs uppercase">
          <tr>
            <th className="text-left py-1">Opción</th>
            <th className="text-right py-1">Ajuste</th>
            <th className="text-left py-1">Consume</th>
          </tr>
        </thead>
        <tbody>
          {group.options.length === 0 && <tr><td colSpan={3} className="py-3 text-brand-primary/40">Sin opciones.</td></tr>}
          {group.options.map((o) => (
            <tr key={o.id} className="border-t border-gray-100">
              <td className="py-2 text-brand-primary">{o.name}</td>
              <td className="py-2 text-right tabular-nums text-brand-primary/70">{o.price_delta ? money(o.price_delta) : '—'}</td>
              <td className="py-2 text-brand-primary/60">
                {o.consume_stock_item_id != null && o.consume_qty != null
                  ? `${o.consume_qty} ${o.consume_uom_id != null ? (uomCode.get(o.consume_uom_id) ?? '') : ''} · ${itemName.get(o.consume_stock_item_id) ?? ''}`
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex flex-wrap items-end gap-2 border-t border-gray-100 pt-3">
        <label className="flex-1 min-w-[140px]">
          <span className="font-brand text-xs font-semibold text-brand-primary block mb-1">Opción</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm" />
        </label>
        <label>
          <span className="font-brand text-xs font-semibold text-brand-primary block mb-1">Ajuste precio</span>
          <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="w-28 border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm" />
        </label>
        <label>
          <span className="font-brand text-xs font-semibold text-brand-primary block mb-1">Consume ítem</span>
          <select value={consume} onChange={(e) => setConsume(e.target.value === '' ? '' : Number(e.target.value))} className="border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm">
            <option value="">—</option>
            {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </label>
        <label>
          <span className="font-brand text-xs font-semibold text-brand-primary block mb-1">Cant.</span>
          <input type="number" value={qty} onChange={(e) => setQty(e.target.value === '' ? '' : Number(e.target.value))} className="w-20 border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm" />
        </label>
        <label>
          <span className="font-brand text-xs font-semibold text-brand-primary block mb-1">Unidad</span>
          <select value={uomId} onChange={(e) => setUomId(e.target.value === '' ? '' : Number(e.target.value))} className="border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm">
            <option value="">—</option>
            {uoms.map((u) => <option key={u.id} value={u.id}>{u.code}</option>)}
          </select>
        </label>
        <button onClick={addOption} disabled={busy} className="rounded-full border border-brand-primary text-brand-primary px-4 py-2 font-brand text-sm hover:bg-brand-primary hover:text-brand-cream disabled:opacity-50">{busy ? '…' : 'Agregar opción'}</button>
      </div>
      {err && <p className="font-brand text-sm text-red-600">{err}</p>}
    </div>
  )
}
