'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Validación manual del pago por el administrador (HU-096).
 * Confirmar → payment_status='approved' + status='processing'.
 * Rechazar  → payment_status='rejected'.
 */
export default function PaymentStatusValidator({ orderId }: { orderId: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approved' | 'rejected' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function submit(payment_status: 'approved' | 'rejected') {
    setLoading(payment_status)
    setError(null)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/payment-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Error')
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-brand-primary/10">
      <p className="font-brand text-xs text-brand-primary/50 mb-2">Validación manual del pago</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => submit('approved')}
          disabled={loading !== null}
          className="flex-1 bg-green-600 text-white rounded-xl py-2 font-brand text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {loading === 'approved' ? 'Confirmando…' : 'Confirmar pago'}
        </button>
        <button
          type="button"
          onClick={() => submit('rejected')}
          disabled={loading !== null}
          className="flex-1 border border-red-300 text-red-600 rounded-xl py-2 font-brand text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          {loading === 'rejected' ? 'Rechazando…' : 'Rechazar pago'}
        </button>
      </div>
      {error && <p className="font-brand text-xs text-red-600 mt-1.5 text-center">{error}</p>}
    </div>
  )
}
