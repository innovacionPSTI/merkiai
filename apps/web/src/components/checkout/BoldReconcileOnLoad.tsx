'use client'

import { useEffect, useRef } from 'react'

/**
 * Dispara UNA vez la reconciliación de pago Bold al cargar la confirmación.
 * Best-effort y silencioso: si el pedido no es Bold o no hay novedad, el endpoint
 * responde sin efectos. Sirve para reflejar el pago cuando el webhook aún no llega.
 */
export default function BoldReconcileOnLoad({ order }: { order: string }) {
  const done = useRef(false)

  useEffect(() => {
    if (done.current || !order) return
    done.current = true
    fetch('/api/checkout/bold/reconcile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order }),
    }).catch(() => {})
  }, [order])

  return null
}
