'use client'

/**
 * LocationsManager (E18 · HU-176) — lista y crea ubicaciones, marca la
 * predeterminada y activa/desactiva. CRUD mínimo sobre `/api/admin/locations`.
 */
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Row { id: number; code: string; name: string; kind: string; city: string | null; is_default: boolean; active: boolean }
const KIND_LABEL: Record<string, string> = { warehouse: 'Bodega', store: 'Tienda', pickup: 'Punto de retiro' }

export default function LocationsManager({ locations: initial }: { locations: Row[] }) {
  const router = useRouter()
  const [rows, setRows] = useState(initial)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [kind, setKind] = useState('warehouse')
  const [city, setCity] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function reload() {
    const res = await fetch('/api/admin/locations')
    if (res.ok) setRows((await res.json()).locations ?? [])
  }

  async function create() {
    if (!name.trim() || !code.trim()) { setError('Código y nombre son requeridos'); return }
    setBusy(true); setError(null)
    try {
      const res = await fetch('/api/admin/locations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), name: name.trim(), kind, city: city.trim() || null, is_default: isDefault }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error ?? 'No se pudo crear')
      setName(''); setCode(''); setKind('warehouse'); setCity(''); setIsDefault(false)
      await reload(); router.refresh()
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') } finally { setBusy(false) }
  }

  async function patch(id: number, body: Record<string, unknown>) {
    const res = await fetch(`/api/admin/locations/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    if (res.ok) { await reload(); router.refresh() }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
        <h2 className="font-display text-brand-primary text-lg">Nueva ubicación</h2>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex-1 min-w-[160px]">
            <span className="font-brand text-xs font-semibold text-brand-primary block mb-1">Nombre</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm" />
          </label>
          <label>
            <span className="font-brand text-xs font-semibold text-brand-primary block mb-1">Código</span>
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="bod-01" className="w-32 border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm" />
          </label>
          <label>
            <span className="font-brand text-xs font-semibold text-brand-primary block mb-1">Tipo</span>
            <select value={kind} onChange={(e) => setKind(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm">
              {Object.entries(KIND_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label>
            <span className="font-brand text-xs font-semibold text-brand-primary block mb-1">Ciudad</span>
            <input value={city} onChange={(e) => setCity(e.target.value)} className="w-36 border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm" />
          </label>
          <label className="flex items-center gap-2 font-brand text-sm text-brand-primary">
            <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} /> Predeterminada
          </label>
          <button onClick={create} disabled={busy} className="rounded-full bg-brand-primary text-brand-cream px-5 py-2 font-brand text-sm font-medium hover:bg-brand-dark disabled:opacity-50">{busy ? 'Creando…' : 'Agregar'}</button>
        </div>
        {error && <p className="font-brand text-sm text-red-600">{error}</p>}
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm font-brand">
          <thead className="bg-slate-50 text-brand-primary/60 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Nombre</th>
              <th className="text-left px-4 py-3">Código</th>
              <th className="text-left px-4 py-3">Tipo</th>
              <th className="text-left px-4 py-3">Ciudad</th>
              <th className="text-right px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-brand-primary/40">Aún no hay ubicaciones.</td></tr>}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-gray-100">
                <td className="px-4 py-3 text-brand-primary font-medium">{r.name} {r.is_default && <span className="text-xs text-green-700">· predeterminada</span>} {!r.active && <span className="text-xs text-red-500">· inactiva</span>}</td>
                <td className="px-4 py-3 text-brand-primary/60"><code>{r.code}</code></td>
                <td className="px-4 py-3 text-brand-primary/70">{KIND_LABEL[r.kind] ?? r.kind}</td>
                <td className="px-4 py-3 text-brand-primary/60">{r.city ?? '—'}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex gap-2 justify-end">
                    {!r.is_default && <button onClick={() => patch(r.id, { is_default: true })} className="font-brand text-xs text-brand-primary underline">Hacer predeterminada</button>}
                    <button onClick={() => patch(r.id, { active: !r.active })} className="font-brand text-xs text-brand-primary/60 underline">{r.active ? 'Desactivar' : 'Activar'}</button>
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
