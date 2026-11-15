'use client'

/**
 * InventoryManager (E24 · HU-400/401/403) — lista de ítems de inventario con
 * disponible/costo/UoM y un formulario mínimo para crear ítems. El disponible y
 * el costo son de solo lectura (se derivan del libro de movimientos).
 */
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatNumber } from '@merkiai/i18n'
import { T } from '@merkiai/ui'
import { useTx } from '@merkiai/ui'

interface Row {
  id: number; key: string; name: string; item_class: string
  uom: string; sellable: boolean; active: boolean
  available: number; cost: number | null
}
interface UomOpt { id: number; code: string; name: string }

const CLASS_LABEL: Record<string, string> = {
  materia_prima: 'Materia prima', insumo: 'Insumo', terminado: 'Terminado', servicio: 'Servicio',
}

function fmt(n: number): string {
  return formatNumber(n, { maximumFractionDigits: 3 })
}

export default function InventoryManager({ initial, uoms }: { initial: Row[]; uoms: UomOpt[] }) {
  const tx = useTx()
  const router = useRouter()
  const [name, setName] = useState('')
  const [itemClass, setItemClass] = useState('materia_prima')
  const [uomId, setUomId] = useState<number | ''>(uoms[0]?.id ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [backfillBusy, setBackfillBusy] = useState(false)
  const [backfillMsg, setBackfillMsg] = useState<string | null>(null)
  const [backfillConfirm, setBackfillConfirm] = useState(false)

  async function backfill() {
    setBackfillConfirm(false); setBackfillBusy(true); setBackfillMsg(null)
    try {
      const res = await fetch('/api/admin/inventory/backfill-stock', { method: 'POST' })
      const b = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(b?.error ?? 'No se pudo ejecutar')
      setBackfillMsg(tx("Listo: {applied} aperturas nuevas sobre {items} ítems.", { applied: b.applied, items: b.items }))
      router.refresh()
    } catch (e) { setBackfillMsg(e instanceof Error ? e.message : tx("Error")) } finally { setBackfillBusy(false) }
  }

  async function create() {
    if (!name.trim()) { setError(tx("El nombre es obligatorio")); return }
    setSaving(true); setError(null)
    try {
      const res = await fetch('/api/admin/inventory/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), item_class: itemClass, uom_id: uomId === '' ? null : uomId }),
      })
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b?.error ?? 'No se pudo crear') }
      setName('')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : tx("Error de red"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Backfill de saldo de apertura al ledger (E18·HU-178) */}
      <div className="flex items-center justify-end gap-3 flex-wrap">
        {backfillMsg && <span className="font-brand text-xs text-brand-primary/60">{backfillMsg}</span>}
        {backfillConfirm ? (
          <div className="flex items-center gap-2">
            <span className="font-brand text-xs text-brand-primary/60"><T>Inicializa saldos de apertura desde el stock actual de las variantes enlazadas (idempotente). ¿Confirmar?</T></span>
            <button onClick={backfill} disabled={backfillBusy} className="rounded-full bg-brand-primary text-brand-cream px-4 py-2 font-brand text-sm hover:bg-brand-dark disabled:opacity-50">{backfillBusy ? tx("Inicializando…") : tx("Confirmar")}</button>
            <button onClick={() => setBackfillConfirm(false)} className="rounded-full border border-gray-200 text-brand-primary/60 px-4 py-2 font-brand text-sm"><T>Cancelar</T></button>
          </div>
        ) : (
          <button onClick={() => { setBackfillMsg(null); setBackfillConfirm(true) }} className="rounded-full border border-gray-200 text-brand-primary px-4 py-2 font-brand text-sm hover:bg-slate-50">Inicializar saldos (ledger)</button>
        )}
      </div>

      {/* Alta rápida */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h2 className="font-display text-brand-primary text-lg mb-3"><T>Nuevo ítem</T></h2>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex-1 min-w-[200px]">
            <span className="font-brand text-xs font-semibold text-brand-primary block mb-1"><T>Nombre</T></span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={tx("Ej. Materia prima, insumo o producto")}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm focus:outline-none focus:border-brand-primary" />
          </label>
          <label>
            <span className="font-brand text-xs font-semibold text-brand-primary block mb-1"><T>Clase</T></span>
            <select value={itemClass} onChange={(e) => setItemClass(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm">
              {Object.entries(CLASS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label>
            <span className="font-brand text-xs font-semibold text-brand-primary block mb-1"><T>Unidad</T></span>
            <select value={uomId} onChange={(e) => setUomId(e.target.value === '' ? '' : Number(e.target.value))}
              className="border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm">
              <option value="">—</option>
              {uoms.map((u) => <option key={u.id} value={u.id}>{u.code}</option>)}
            </select>
          </label>
          <button onClick={create} disabled={saving}
            className="rounded-full bg-brand-primary text-brand-cream px-5 py-2 font-brand text-sm font-medium hover:bg-brand-dark disabled:opacity-50">
            {saving ? tx("Creando…") : tx("Agregar")}
          </button>
        </div>
        {error && <p className="font-brand text-sm text-red-600 mt-2">{error}</p>}
      </div>

      {/* Listado */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm font-brand">
          <thead className="bg-slate-50 text-brand-primary/60 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3"><T>Ítem</T></th>
              <th className="text-left px-4 py-3"><T>Clase</T></th>
              <th className="text-right px-4 py-3"><T>Disponible</T></th>
              <th className="text-left px-4 py-3"><T>Unidad</T></th>
              <th className="text-right px-4 py-3"><T>Costo unit.</T></th>
              <th className="text-center px-4 py-3"><T>Vendible</T></th>
            </tr>
          </thead>
          <tbody>
            {initial.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-brand-primary/40"><T>Aún no hay ítems de inventario. Crea el primero arriba.</T></td></tr>
            )}
            {initial.map((r) => (
              <tr key={r.id} className="border-t border-gray-100">
                <td className="px-4 py-3">
                  <a href={`/inventario/${encodeURIComponent(r.key)}`} className="text-brand-primary font-medium hover:underline">{r.name}</a>
                  <span className="block text-brand-primary/40 text-xs">{r.key}</span>
                </td>
                <td className="px-4 py-3 text-brand-primary/70">{CLASS_LABEL[r.item_class] ?? r.item_class}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmt(r.available)}</td>
                <td className="px-4 py-3 text-brand-primary/70">{r.uom || '—'}</td>
                <td className="px-4 py-3 text-right tabular-nums">{r.cost == null ? '—' : fmt(r.cost)}</td>
                <td className="px-4 py-3 text-center">{r.sellable ? '✓' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
