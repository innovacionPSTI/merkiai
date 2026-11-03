'use client'

/**
 * TransferInbox (E18·HU-180 AC-3) — transferencias **en tránsito** del ítem:
 * permite **recibir** (entra al destino) o **cancelar** (reingresa al origen).
 */
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Row { id: number; from: string; to: string; qty: number; shipped_at: string | null }

export default function TransferInbox({ transfers }: { transfers: Row[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function act(id: number, action: 'receive' | 'cancel') {
    setBusy(id); setError(null)
    try {
      const res = await fetch(`/api/admin/inventory/transfers/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error ?? 'No se pudo')
      router.refresh()
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') } finally { setBusy(null) }
  }

  if (!transfers.length) return null
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <h2 className="font-display text-brand-primary text-lg mb-3">Transferencias en tránsito</h2>
      <table className="w-full text-sm font-brand">
        <thead className="text-brand-primary/50 text-xs uppercase">
          <tr><th className="text-left py-1">Origen → Destino</th><th className="text-right py-1">Cantidad</th><th className="text-left py-1">Despachada</th><th className="text-right py-1">Acciones</th></tr>
        </thead>
        <tbody>
          {transfers.map((t) => (
            <tr key={t.id} className="border-t border-gray-100">
              <td className="py-2 text-brand-primary">{t.from} → {t.to}</td>
              <td className="py-2 text-right tabular-nums text-brand-primary/70">{t.qty}</td>
              <td className="py-2 text-brand-primary/60">{t.shipped_at ? new Date(t.shipped_at).toLocaleString('es-CO') : '—'}</td>
              <td className="py-2 text-right">
                <div className="flex gap-2 justify-end">
                  <button onClick={() => act(t.id, 'receive')} disabled={busy === t.id} className="font-brand text-xs text-green-700 underline disabled:opacity-50">Recibir</button>
                  <button onClick={() => act(t.id, 'cancel')} disabled={busy === t.id} className="font-brand text-xs text-red-500 underline disabled:opacity-50">Cancelar</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {error && <p className="font-brand text-sm text-red-600 mt-2">{error}</p>}
    </div>
  )
}
