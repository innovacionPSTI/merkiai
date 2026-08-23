'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

type UiStatus = 'loading' | 'approved' | 'pending' | 'rejected' | 'generic'

const RECONCILE_ENDPOINT: Record<string, string> = {
  tucompra: '/api/checkout/tucompra/reconcile',
  bold: '/api/checkout/bold/reconcile',
}

/**
 * Muestra el estado REAL del pago en la confirmación. Para pasarelas con
 * confirmación diferida (Tu Compra, Bold) dispara el reconcile y sondea el estado
 * unas veces; para el resto lee el estado que dejó el webhook. Sin pedido en la URL
 * cae a un mensaje genérico de "pedido recibido".
 */
export default function ConfirmationStatus({ order, whatsapp }: { order: string | null; whatsapp: string }) {
  const [status, setStatus] = useState<UiStatus>(order ? 'loading' : 'generic')
  const [method, setMethod] = useState<string | null>(null)
  const started = useRef(false)

  useEffect(() => {
    if (!order || started.current) return
    started.current = true
    let cancelled = false

    const readStatus = async (): Promise<{ paymentStatus: string; paymentMethod: string | null } | null> => {
      try {
        const r = await fetch(`/api/checkout/status?order=${encodeURIComponent(order)}`)
        if (!r.ok) return null
        const d = await r.json()
        return { paymentStatus: d.payment_status, paymentMethod: d.payment_method ?? null }
      } catch { return null }
    }

    const run = async () => {
      let info = await readStatus()
      if (cancelled) return
      if (!info) { setStatus('generic'); return }
      setMethod(info.paymentMethod)

      const endpoint = info.paymentMethod ? RECONCILE_ENDPOINT[info.paymentMethod] : undefined
      // Sondea mientras esté pendiente y la pasarela tenga reconcile diferido.
      for (let i = 0; i < 5 && !cancelled && info && info.paymentStatus === 'pending' && endpoint; i++) {
        try {
          await fetch(endpoint, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order }),
          })
        } catch { /* reintenta */ }
        if (cancelled) return
        info = await readStatus()
        if (info) setMethod(info.paymentMethod)
        if (info && info.paymentStatus !== 'pending') break
        await new Promise((res) => setTimeout(res, 4000))
      }

      if (cancelled || !info) return
      setStatus(info.paymentStatus === 'approved' ? 'approved' : info.paymentStatus === 'rejected' ? 'rejected' : 'pending')
    }

    run()
    return () => { cancelled = true }
  }, [order])

  const orderLine = order ? (
    <p className="font-brand text-brand-primary/60 text-lg mb-2">
      Orden <strong className="text-brand-primary">{order}</strong>
    </p>
  ) : null

  const actions = (
    <div className="flex flex-col gap-3">
      {status === 'rejected' ? (
        <Link href="/checkout" className="bg-brand-primary text-brand-cream rounded-full py-3 px-8 font-brand font-medium hover:bg-brand-dark transition-colors">
          Reintentar el pago
        </Link>
      ) : (
        <Link href="/account/orders" className="bg-brand-primary text-brand-cream rounded-full py-3 px-8 font-brand font-medium hover:bg-brand-dark transition-colors">
          Ver mis pedidos
        </Link>
      )}
      <Link href="/shop" className="border border-brand-primary text-brand-primary rounded-full py-3 px-8 font-brand font-medium hover:bg-brand-primary hover:text-brand-cream transition-colors">
        Seguir comprando
      </Link>
    </div>
  )

  const whatsappLine = (
    <p className="font-brand text-xs text-brand-primary/40 mt-8">
      ¿Preguntas? Escríbenos por{' '}
      <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="underline">WhatsApp</a>
    </p>
  )

  // ── Encabezado por estado ──────────────────────────────────────────
  let icon: React.ReactNode
  let title: string
  let message: string

  if (status === 'loading') {
    icon = <span className="inline-block w-9 h-9 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
    title = 'Confirmando tu pago…'
    message = 'Estamos verificando el estado de tu pago. Esto puede tomar unos segundos.'
  } else if (status === 'approved') {
    icon = (
      <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    )
    title = '¡Pago confirmado!'
    message = 'Recibirás un correo con los detalles de tu pedido y el número de seguimiento cuando sea despachado.'
  } else if (status === 'rejected') {
    icon = (
      <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    )
    title = 'Pago rechazado'
    message = 'Tu pago no pudo procesarse. Puedes reintentar con otro medio de pago o banco.'
  } else if (status === 'pending') {
    icon = (
      <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
    title = 'Pago en proceso'
    message = method === 'manual'
      ? 'Tu pedido quedó registrado y está pendiente de validación del pago. Te avisaremos por correo cuando se confirme.'
      : method === 'tucompra'
        ? 'Tu pago está pendiente de confirmación (por ejemplo, aprobación en tu app o pago en efectivo). Te avisaremos por correo cuando se acredite.'
        : 'Tu pago está pendiente de confirmación. Te avisaremos por correo en cuanto se acredite.'
  } else {
    // genérico (sin pedido en la URL)
    icon = (
      <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    )
    title = '¡Pedido recibido!'
    message = 'Recibirás un correo con los detalles de tu pedido.'
  }

  const ring =
    status === 'approved' || status === 'generic' ? 'bg-green-100'
    : status === 'rejected' ? 'bg-red-100'
    : status === 'pending' ? 'bg-amber-100'
    : 'bg-brand-cream'

  return (
    <div className="text-center max-w-md">
      <div className={`w-20 h-20 rounded-full ${ring} flex items-center justify-center mx-auto mb-6`}>{icon}</div>
      <h1 className="font-display text-brand-primary text-4xl mb-3">{title}</h1>
      {orderLine}
      <p className="font-brand text-brand-primary/60 mb-8 leading-relaxed">{message}</p>
      {actions}
      {whatsappLine}
    </div>
  )
}
