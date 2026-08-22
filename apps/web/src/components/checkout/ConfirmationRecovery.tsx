'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Recupera el número de pedido al volver de la pasarela cuando la URL de Retorno
 * no incluye `?order=` (caso Tu Compra con Nequi/Daviplata/Referenciado, cuya URL
 * de Retorno la fija el panel de forma global). Lee el pedido guardado en
 * sessionStorage antes de redirigir y reescribe la URL para que la página muestre
 * la orden y dispare la reconciliación.
 */
export default function ConfirmationRecovery({ hasOrder }: { hasOrder: boolean }) {
  const router = useRouter()

  useEffect(() => {
    if (hasOrder) {
      // El pedido llegó por la URL: limpia el respaldo para no reusarlo luego.
      try { sessionStorage.removeItem('lastOrder') } catch { /* ignore */ }
      return
    }
    let saved: string | null = null
    try { saved = sessionStorage.getItem('lastOrder') } catch { /* ignore */ }
    if (saved) {
      try { sessionStorage.removeItem('lastOrder') } catch { /* ignore */ }
      router.replace(`/checkout/confirmation?order=${encodeURIComponent(saved)}`)
    }
  }, [hasOrder, router])

  return null
}
