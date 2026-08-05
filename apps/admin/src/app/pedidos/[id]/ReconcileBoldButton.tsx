'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Botón "Verificar pago con Bold" — reconcilia manualmente un pago Bold pendiente
 * contra el servicio de fallback de Bold. Solo se muestra para pedidos Bold que
 * aún no están aprobados.
 */
export default function ReconcileBoldButton({ orderId }: { orderId: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/reconcile-bold`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error')
      if (data.status === 'approved') {
        setMsg('✓ Pago confirmado')
        router.refresh()
      } else if (data.status === 'rejected') {
        setMsg('Pago rechazado')
        router.refresh()
      } else {
        setMsg('Aún sin confirmación de Bold')
      }
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-brand-primary/10">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="w-full bg-brand-primary/10 text-brand-primary rounded-xl py-2 font-brand text-sm font-medium hover:bg-brand-primary/20 transition-colors disabled:opacity-50"
      >
        {loading ? 'Consultando a Bold…' : 'Verificar pago con Bold'}
      </button>
      {msg && <p className="font-brand text-xs text-brand-primary/60 mt-1.5 text-center">{msg}</p>}
    </div>
  )
}
