'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { OrderReturn } from '@merkiai/database'

const STATUS: Record<string, { label: string; cls: string }> = {
  requested: { label: 'Solicitada', cls: 'bg-amber-100 text-amber-700' },
  approved:  { label: 'Aprobada',   cls: 'bg-green-100 text-green-700' },
  rejected:  { label: 'Rechazada',  cls: 'bg-red-100 text-red-700' },
}

const fmtDate = (s: string) => new Date(s).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })

/**
 * HU-107a · Gestión de devoluciones (RMA) de un pedido. Permite registrar una
 * devolución (si el pedido es elegible) y aprobar/rechazar las solicitadas, con
 * opción de reponer stock al aprobar. Historial asociado al pedido (AC-3).
 */
export default function ReturnsManager({
  orderId, orderNumber, canStart, initialReturns,
}: {
  orderId: number
  orderNumber: string
  canStart: boolean
  initialReturns: OrderReturn[]
}) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      const res = await fetch('/api/admin/returns', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, order_number: orderNumber, reason, note }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? 'No se pudo registrar'); return }
      setShowForm(false); setReason(''); setNote('')
      router.refresh()
    } finally { setBusy(false) }
  }

  async function resolve(id: number, status: 'approved' | 'rejected', restock: boolean) {
    setBusy(true); setError('')
    try {
      const res = await fetch(`/api/admin/returns/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, restock }),
      })
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error ?? 'No se pudo actualizar'); return }
      router.refresh()
    } finally { setBusy(false) }
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-brand-primary text-lg">Devoluciones</h2>
        {canStart && !showForm && (
          <button onClick={() => setShowForm(true)}
            className="font-brand text-sm border border-brand-primary text-brand-primary rounded-full px-4 py-1.5 hover:bg-brand-primary hover:text-brand-cream transition-colors">
            Registrar devolución
          </button>
        )}
      </div>

      {!canStart && initialReturns.length === 0 && (
        <p className="font-brand text-sm text-brand-primary/40">
          Las devoluciones se habilitan cuando el pago está aprobado o el pedido fue entregado.
        </p>
      )}

      {showForm && (
        <form onSubmit={create} className="border border-brand-primary/10 rounded-xl p-4 mb-4 space-y-3">
          <div>
            <label className="font-brand text-xs text-brand-primary/50 block mb-1">Motivo</label>
            <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500}
              placeholder="Ej: producto defectuoso"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm focus:outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="font-brand text-xs text-brand-primary/50 block mb-1">Nota interna (opcional)</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm focus:outline-none focus:border-brand-primary resize-none" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={busy}
              className="font-brand text-sm bg-brand-primary text-brand-cream rounded-full px-4 py-2 hover:bg-brand-dark transition-colors disabled:opacity-50">
              {busy ? 'Guardando…' : 'Registrar'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="font-brand text-sm border border-gray-200 text-brand-primary rounded-full px-4 py-2 hover:bg-gray-50">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {error && <p className="font-brand text-sm text-red-500 mb-3">{error}</p>}

      {initialReturns.length === 0 ? (
        canStart && <p className="font-brand text-sm text-brand-primary/40">Sin devoluciones registradas.</p>
      ) : (
        <ul className="space-y-3">
          {initialReturns.map((r) => (
            <li key={r.id} className="border border-brand-primary/10 rounded-xl p-3">
              <div className="flex items-center justify-between gap-2">
                <span className={`font-brand text-xs font-medium rounded-full px-2.5 py-1 ${STATUS[r.status]?.cls ?? ''}`}>
                  {STATUS[r.status]?.label ?? r.status}
                </span>
                <span className="font-brand text-xs text-brand-primary/40">{fmtDate(r.created_at)}</span>
              </div>
              {r.reason && <p className="font-brand text-sm text-brand-primary mt-2">{r.reason}</p>}
              {r.note && <p className="font-brand text-xs text-brand-primary/50 mt-1">{r.note}</p>}
              {r.restocked && <p className="font-brand text-xs text-green-600 mt-1">Stock repuesto</p>}
              {r.status === 'requested' && (
                <ReturnActions busy={busy} onApprove={(restock) => resolve(r.id, 'approved', restock)} onReject={() => resolve(r.id, 'rejected', false)} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ReturnActions({ busy, onApprove, onReject }: { busy: boolean; onApprove: (restock: boolean) => void; onReject: () => void }) {
  const [restock, setRestock] = useState(true)
  return (
    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-brand-primary/5">
      <label className="font-brand text-xs text-brand-primary/60 inline-flex items-center gap-1.5">
        <input type="checkbox" checked={restock} onChange={(e) => setRestock(e.target.checked)} />
        Reponer stock
      </label>
      <button disabled={busy} onClick={() => onApprove(restock)}
        className="font-brand text-xs bg-green-600 text-white rounded-full px-4 py-1.5 hover:bg-green-700 transition-colors disabled:opacity-50">
        Aprobar
      </button>
      <button disabled={busy} onClick={onReject}
        className="font-brand text-xs border border-red-300 text-red-600 rounded-full px-4 py-1.5 hover:bg-red-50 transition-colors disabled:opacity-50">
        Rechazar
      </button>
    </div>
  )
}
