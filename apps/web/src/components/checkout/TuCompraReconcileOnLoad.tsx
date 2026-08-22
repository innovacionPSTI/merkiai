'use client'

import { useEffect, useRef } from 'react'

/**
 * Dispara UNA vez la reconciliación de pago Tu Compra al cargar la confirmación.
 * Tu Compra no tiene webhook, así que esta reconsulta es el mecanismo principal de
 * confirmación. Best-effort y silencioso: si el pedido no es Tu Compra o no hay
 * novedad, el endpoint responde sin efectos.
 */
export default function TuCompraReconcileOnLoad({ order }: { order: string }) {
  const done = useRef(false)

  useEffect(() => {
    if (done.current || !order) return
    done.current = true
    fetch('/api/checkout/tucompra/reconcile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order }),
    }).catch(() => {})
  }, [order])

  return null
}
