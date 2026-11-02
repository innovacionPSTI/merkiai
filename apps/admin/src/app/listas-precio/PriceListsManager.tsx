'use client'

/**
 * PriceListsManager (E24 · HU-407) — gestiona listas de precio y sus precios por
 * producto. Crea listas con su ámbito (canal/sede/segmento/genérica) y prioridad;
 * al seleccionar una lista, define precios por producto (upsert). La resolución
 * del precio efectivo en la venta queda pendiente (coordinada con el checkout).
 */
import { useState } from 'react'

interface PriceList { id: number; key: string; name: string; scope_type: string; scope_value: string | null; priority: number; active: boolean }
interface ProductRef { id: number; name: string; base_price: number | null }
interface Item { id: number; product_id: number | null; variant_id: number | null; price: number }

const SCOPE_LABEL: Record<string, string> = { generic: 'Genérica', channel: 'Canal', location: 'Sede', segment: 'Segmento' }
function money(n: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}

export default function PriceListsManager({ lists: initialLists, products }: { lists: PriceList[]; products: ProductRef[] }) {
  const [lists, setLists] = useState<PriceList[]>(initialLists)
  const [error, setError] = useState<string | null>(null)

  // alta de lista
  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const [scopeType, setScopeType] = useState('generic')
  const [scopeValue, setScopeValue] = useState('')
  const [priority, setPriority] = useState(0)
  const [busy, setBusy] = useState(false)

  async function reloadLists() {
    const res = await fetch('/api/admin/price-lists')
    if (res.ok) setLists((await res.json()).lists ?? [])
  }

  async function addList() {
    if (!name.trim() || !key.trim()) { setError('Clave y nombre son requeridos'); return }
    setBusy(true); setError(null)
    try {
      const res = await fetch('/api/admin/price-lists', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: key.trim(), name: name.trim(), scope_type: scopeType, scope_value: scopeType === 'generic' ? null : scopeValue.trim(), priority }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error ?? 'No se pudo crear')
      setName(''); setKey(''); setScopeType('generic'); setScopeValue(''); setPriority(0)
      await reloadLists()
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') } finally { setBusy(false) }
  }

  async function toggleActive(l: PriceList) {
    const res = await fetch(`/api/admin/price-lists/${l.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !l.active }),
    })
    if (res.ok) await reloadLists()
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
        <h2 className="font-display text-brand-primary text-lg">Nueva lista</h2>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex-1 min-w-[160px]">
            <span className="font-brand text-xs font-semibold text-brand-primary block mb-1">Nombre</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm" />
          </label>
          <label>
            <span className="font-brand text-xs font-semibold text-brand-primary block mb-1">Clave</span>
            <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="pos, mayorista…" className="w-36 border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm" />
          </label>
          <label>
            <span className="font-brand text-xs font-semibold text-brand-primary block mb-1">Ámbito</span>
            <select value={scopeType} onChange={(e) => setScopeType(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm">
              {Object.entries(SCOPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          {scopeType !== 'generic' && (
            <label>
              <span className="font-brand text-xs font-semibold text-brand-primary block mb-1">Valor del ámbito</span>
              <input value={scopeValue} onChange={(e) => setScopeValue(e.target.value)} placeholder={scopeType === 'channel' ? 'pos / online' : scopeType === 'location' ? 'id sede' : 'segmento'} className="w-36 border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm" />
            </label>
          )}
          <label>
            <span className="font-brand text-xs font-semibold text-brand-primary block mb-1">Prioridad</span>
            <input type="number" value={priority} onChange={(e) => setPriority(Number(e.target.value))} className="w-24 border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm" />
          </label>
          <button onClick={addList} disabled={busy} className="rounded-full bg-brand-primary text-brand-cream px-5 py-2 font-brand text-sm font-medium hover:bg-brand-dark disabled:opacity-50">{busy ? 'Creando…' : 'Crear lista'}</button>
        </div>
        {error && <p className="font-brand text-sm text-red-600">{error}</p>}
      </div>

      {lists.length === 0 && <p className="font-brand text-sm text-brand-primary/40">Aún no hay listas de precio. Sin listas, rige el precio actual de cada producto.</p>}

      {lists.map((l) => (
        <ListCard key={l.id} list={l} products={products} onToggle={() => toggleActive(l)} />
      ))}
    </div>
  )
}

function ListCard({ list, products, onToggle }: { list: PriceList; products: ProductRef[]; onToggle: () => void }) {
  const [items, setItems] = useState<Item[] | null>(null)
  const [open, setOpen] = useState(false)
  const [productId, setProductId] = useState<number | ''>('')
  const [price, setPrice] = useState<number | ''>('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const productName = new Map(products.map((p) => [p.id, p.name]))

  async function loadItems() {
    const res = await fetch(`/api/admin/price-lists/${list.id}/items`)
    if (res.ok) setItems((await res.json()).items ?? [])
  }
  function expand() { setOpen((o) => { if (!o && items == null) loadItems(); return !o }) }

  async function setItem() {
    if (productId === '' || price === '' || Number(price) < 0) { setErr('Producto y precio válidos requeridos'); return }
    setBusy(true); setErr(null)
    try {
      const res = await fetch(`/api/admin/price-lists/${list.id}/items`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, price }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error ?? 'No se pudo guardar')
      setProductId(''); setPrice(''); await loadItems()
    } catch (e) { setErr(e instanceof Error ? e.message : 'Error') } finally { setBusy(false) }
  }

  async function removeItem(id: number) {
    const res = await fetch(`/api/admin/price-lists/items/${id}`, { method: 'DELETE' })
    if (res.ok) await loadItems()
  }

  const scope = list.scope_type === 'generic' ? 'Genérica' : `${SCOPE_LABEL[list.scope_type]}: ${list.scope_value ?? '—'}`

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-brand-primary text-lg">{list.name} {!list.active && <span className="font-brand text-xs text-red-500">(inactiva)</span>}</h3>
          <p className="font-brand text-xs text-brand-primary/50">{scope} · prioridad {list.priority} · clave <code>{list.key}</code></p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onToggle} className="font-brand text-sm text-brand-primary/60 underline">{list.active ? 'Desactivar' : 'Activar'}</button>
          <button onClick={expand} className="font-brand text-sm text-brand-primary underline">{open ? 'Ocultar precios' : 'Editar precios'}</button>
        </div>
      </div>

      {open && (
        <div className="space-y-3 border-t border-gray-100 pt-3">
          <table className="w-full text-sm font-brand">
            <thead className="text-brand-primary/50 text-xs uppercase">
              <tr><th className="text-left py-1">Producto</th><th className="text-right py-1">Precio</th><th /></tr>
            </thead>
            <tbody>
              {items == null && <tr><td colSpan={3} className="py-3 text-brand-primary/40">Cargando…</td></tr>}
              {items != null && items.length === 0 && <tr><td colSpan={3} className="py-3 text-brand-primary/40">Sin precios definidos.</td></tr>}
              {items?.map((it) => (
                <tr key={it.id} className="border-t border-gray-100">
                  <td className="py-2 text-brand-primary">{it.product_id != null ? (productName.get(it.product_id) ?? `#${it.product_id}`) : `Variante #${it.variant_id}`}</td>
                  <td className="py-2 text-right tabular-nums text-brand-primary/70">{money(it.price)}</td>
                  <td className="py-2 text-right"><button onClick={() => removeItem(it.id)} className="font-brand text-xs text-red-500 underline">Quitar</button></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex flex-wrap items-end gap-2">
            <label className="flex-1 min-w-[180px]">
              <span className="font-brand text-xs font-semibold text-brand-primary block mb-1">Producto</span>
              <select value={productId} onChange={(e) => setProductId(e.target.value === '' ? '' : Number(e.target.value))} className="w-full border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm">
                <option value="">Selecciona…</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}{p.base_price != null ? ` · base ${money(p.base_price)}` : ''}</option>)}
              </select>
            </label>
            <label>
              <span className="font-brand text-xs font-semibold text-brand-primary block mb-1">Precio</span>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))} className="w-32 border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm" />
            </label>
            <button onClick={setItem} disabled={busy} className="rounded-full border border-brand-primary text-brand-primary px-4 py-2 font-brand text-sm hover:bg-brand-primary hover:text-brand-cream disabled:opacity-50">{busy ? '…' : 'Guardar precio'}</button>
          </div>
          {err && <p className="font-brand text-sm text-red-600">{err}</p>}
        </div>
      )}
    </div>
  )
}
