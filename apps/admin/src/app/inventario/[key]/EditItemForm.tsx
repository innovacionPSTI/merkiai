'use client'

/**
 * EditItemForm (E24 · HU-400) — edición de los datos de un ítem de inventario
 * (nombre, clase, unidad, vendible, activo). El disponible/costo no se editan
 * (se derivan del libro).
 */
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Item { id: number; name: string; item_class: string; uom_id: number | null; sellable: boolean; active: boolean }
const CLASS_LABEL: Record<string, string> = { materia_prima: 'Materia prima', insumo: 'Insumo', terminado: 'Terminado', servicio: 'Servicio' }

export default function EditItemForm({ item, uoms }: { item: Item; uoms: Array<{ id: number; code: string }> }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(item.name)
  const [itemClass, setItemClass] = useState(item.item_class)
  const [uomId, setUomId] = useState<number | ''>(item.uom_id ?? '')
  const [sellable, setSellable] = useState(item.sellable)
  const [active, setActive] = useState(item.active)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    if (!name.trim()) { setError('El nombre es obligatorio'); return }
    setBusy(true); setError(null)
    try {
      const res = await fetch(`/api/admin/inventory/items/${item.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), item_class: itemClass, uom_id: uomId === '' ? null : uomId, sellable, active }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error ?? 'No se pudo guardar')
      setOpen(false); router.refresh()
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') } finally { setBusy(false) }
  }

  if (!open) {
    return <button onClick={() => setOpen(true)} className="font-brand text-sm text-brand-primary underline">Editar ítem</button>
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
      <h2 className="font-display text-brand-primary text-lg">Editar ítem</h2>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex-1 min-w-[180px]">
          <span className="font-brand text-xs font-semibold text-brand-primary block mb-1">Nombre</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm" />
        </label>
        <label>
          <span className="font-brand text-xs font-semibold text-brand-primary block mb-1">Clase</span>
          <select value={itemClass} onChange={(e) => setItemClass(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm">
            {Object.entries(CLASS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label>
          <span className="font-brand text-xs font-semibold text-brand-primary block mb-1">Unidad</span>
          <select value={uomId} onChange={(e) => setUomId(e.target.value === '' ? '' : Number(e.target.value))} className="border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm">
            <option value="">—</option>
            {uoms.map((u) => <option key={u.id} value={u.id}>{u.code}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 font-brand text-sm text-brand-primary">
          <input type="checkbox" checked={sellable} onChange={(e) => setSellable(e.target.checked)} /> Vendible
        </label>
        <label className="flex items-center gap-2 font-brand text-sm text-brand-primary">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Activo
        </label>
      </div>
      <div className="flex gap-2">
        <button onClick={save} disabled={busy} className="rounded-full bg-brand-primary text-brand-cream px-5 py-2 font-brand text-sm font-medium hover:bg-brand-dark disabled:opacity-50">{busy ? 'Guardando…' : 'Guardar'}</button>
        <button onClick={() => setOpen(false)} className="rounded-full border border-gray-200 text-brand-primary/60 px-4 py-2 font-brand text-sm">Cancelar</button>
      </div>
      {error && <p className="font-brand text-sm text-red-600">{error}</p>}
    </div>
  )
}
