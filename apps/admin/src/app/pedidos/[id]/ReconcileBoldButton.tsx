'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Botón "Verificar pago" — reconcilia manualmente un pago pendiente contra la API
 * de la pasarela (Bold o Tu Compra, que no tienen webhook fiable). Solo se muestra
 * para pedidos de esa pasarela que aún no están aprobados.
 */
const LABEL: Record<'bold' | 'tucompra', string> = { bold: 'Bold', tucompra: 'Tu Compra' }

export default function ReconcileBoldButton({ orderId, provider = 'bold' }: { orderId: number; provider?: 'bold' | 'tucompra' }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/reconcile-${provider}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error')
      if (data.status === 'approved') {
        setMsg('✓ Pago confirmado')
        router.refresh()
      } else if (data.status === 'rejected') {
        setMsg('Pago rechazado')
        router.refresh()
      } else {
        setMsg(`Aún sin confirmación de ${LABEL[provider]}`)
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
        {loading ? `Consultando a ${LABEL[provider]}…` : `Verificar pago con ${LABEL[provider]}`}
      </button>
      {msg && <p className="font-brand text-xs text-brand-primary/60 mt-1.5 text-center">{msg}</p>}
    </div>
  )
}
