'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@merkiai/ui'

interface Redirect {
  id: number
  from_path: string
  to_path: string
  status_code: number
  active: boolean
  note: string | null
  created_at: string
}

export default function RedirectsManager({ initial }: { initial: Redirect[] }) {
  const router = useRouter()
  const [rows, setRows] = useState<Redirect[]>(initial)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [code, setCode] = useState(301)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      const res = await fetch('/api/admin/redirects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_path: from, to_path: to, status_code: code }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error al crear la regla'); return }
      setRows((r) => [data.redirect, ...r])
      setFrom(''); setTo(''); setCode(301)
      router.refresh()
    } finally { setBusy(false) }
  }

  async function toggle(row: Redirect) {
    const res = await fetch(`/api/admin/redirects/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !row.active }),
    })
    if (res.ok) setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, active: !r.active } : r)))
  }

  async function remove(row: Redirect) {
    if (!confirm(`¿Eliminar la regla ${row.from_path} → ${row.to_path}?`)) return
    const res = await fetch(`/api/admin/redirects/${row.id}`, { method: 'DELETE' })
    if (res.ok) setRows((rs) => rs.filter((r) => r.id !== row.id))
  }

  return (
    <div className="space-y-6">
      {/* Alta */}
      <form onSubmit={create} className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="font-display text-brand-primary text-lg">Nueva regla</h2>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
          <label className="block">
            <span className="font-brand text-xs text-brand-primary/50">Origen (ruta vieja)</span>
            <input
              value={from} onChange={(e) => setFrom(e.target.value)} required placeholder="/ruta-vieja"
              className="mt-1 w-full rounded-lg border border-brand-primary/15 px-3 py-2 font-brand text-sm text-brand-primary focus:border-brand-primary focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="font-brand text-xs text-brand-primary/50">Destino (ruta nueva o URL)</span>
            <input
              value={to} onChange={(e) => setTo(e.target.value)} required placeholder="/ruta-nueva"
              className="mt-1 w-full rounded-lg border border-brand-primary/15 px-3 py-2 font-brand text-sm text-brand-primary focus:border-brand-primary focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="font-brand text-xs text-brand-primary/50">Tipo</span>
            <select
              value={code} onChange={(e) => setCode(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-brand-primary/15 px-3 py-2 font-brand text-sm text-brand-primary focus:border-brand-primary focus:outline-none"
            >
              <option value={301}>301 permanente</option>
              <option value={302}>302 temporal</option>
            </select>
          </label>
          <button
            type="submit" disabled={busy}
            className="bg-brand-primary text-brand-cream rounded-full px-5 py-2 font-brand text-sm hover:bg-brand-dark transition-colors disabled:opacity-50 inline-flex items-center gap-2"
          >
            <Icon name="plus" size={16} /> Agregar
          </button>
        </div>
        {error && <p className="font-brand text-sm text-red-600">{error}</p>}
      </form>

      {/* Lista */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="bg-gray-50 text-left font-brand text-xs text-brand-primary/50">
              <th className="px-4 py-3">Origen</th>
              <th className="px-4 py-3">Destino</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center font-brand text-brand-primary/40">Sin reglas de redirección.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-brand text-brand-primary">{r.from_path}</td>
                <td className="px-4 py-3 font-brand text-brand-primary/70">{r.to_path}{r.note ? <span className="block text-xs text-brand-primary/40">{r.note}</span> : null}</td>
                <td className="px-4 py-3 font-brand text-brand-primary/60">{r.status_code}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggle(r)}
                    className={`font-brand text-xs rounded-full px-2 py-1 ${r.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                  >
                    {r.active ? 'Activa' : 'Inactiva'}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => remove(r)} className="font-brand text-xs text-red-600 border border-red-200 rounded-full px-3 py-1 hover:bg-red-50 inline-flex items-center gap-1">
                    <Icon name="trash" size={13} /> Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
