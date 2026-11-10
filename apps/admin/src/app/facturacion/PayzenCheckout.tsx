'use client'

/**
 * Pago del plan con el formulario incrustado de PayZen (HU-440).
 * 1) Pide el formToken al servidor (server action → console → PayZen).
 * 2) Pinta `.kr-smart-form` con el token y carga la librería de PayZen, que
 *    escanea el DOM y monta el formulario (tarjeta + 3DS en sus iframes).
 * 3) Al aprobarse, NO confiamos en el navegador: mostramos "procesando" y el
 *    estado real llega por la IPN (servidor a servidor).
 * El formToken dura 15 minutos; si vence, basta con volver a iniciar.
 */
import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { startCheckoutAction } from './actions'
import type { CheckoutSession } from '@/lib/billing'

const KR_BASE = 'https://static.payzen.lat/static/js/krypton-client/V4.0'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    KR?: any
  }
}

function loadScript(src: string, attrs: Record<string, string> = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = src
    s.async = false
    for (const [k, v] of Object.entries(attrs)) s.setAttribute(k, v)
    s.onload = () => resolve()
    s.onerror = () => reject(new Error(`No se pudo cargar ${src}`))
    document.head.appendChild(s)
  })
}

function PayzenForm({ session }: { session: CheckoutSession }) {
  const router = useRouter()
  const mounted = useRef(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (mounted.current) return
    mounted.current = true
    if (!session.publicKey) { setError('Falta la llave pública de PayZen en la consola.'); return }
    const css = document.createElement('link')
    css.rel = 'stylesheet'
    css.href = `${KR_BASE}/ext/neon-reset.min.css`
    document.head.appendChild(css)
    loadScript(`${KR_BASE}/stable/kr-payment-form.min.js`, { 'kr-public-key': session.publicKey, 'kr-language': 'es-CO' })
      .then(() => loadScript(`${KR_BASE}/ext/neon.js`))
      .then(() => {
        // Pago aprobado en el navegador → el estado definitivo lo fija la IPN.
        window.KR?.onSubmit?.(() => {
          router.push('/facturacion?pago=procesando')
          router.refresh()
          return false
        })
      })
      .catch((e: Error) => setError(e.message))
  }, [session, router])

  if (error) return <p className="font-brand text-sm text-red-600">{error}</p>
  return (
    <div className="max-w-md">
      <div className="kr-smart-form" {...{ 'kr-card-form-expanded': '', 'kr-form-token': session.formToken }} />
      <p className="font-brand text-xs text-brand-primary/50 mt-3">
        Pago seguro procesado por PayZen. Merkiai no almacena los datos de tu tarjeta.
      </p>
    </div>
  )
}

export default function PayzenCheckout({ cta, defaultInterval }: { cta: string; defaultInterval: 'monthly' | 'yearly' }) {
  const [interval, setInterval] = useState<'monthly' | 'yearly'>(defaultInterval)
  const [session, setSession] = useState<CheckoutSession | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  if (session) return <PayzenForm session={session} />

  return (
    <div className="space-y-4">
      <fieldset className="flex gap-4 font-brand text-sm text-brand-primary">
        <legend className="sr-only">Periodicidad del cobro</legend>
        <label className="flex items-center gap-2">
          <input type="radio" name="interval" checked={interval === 'monthly'} onChange={() => setInterval('monthly')} /> Mensual
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="interval" checked={interval === 'yearly'} onChange={() => setInterval('yearly')} /> Anual
        </label>
      </fieldset>
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => {
          setError(null)
          const r = await startCheckoutAction(interval)
          if (r.ok) setSession(r.session)
          else setError(r.error)
        })}
        className="font-brand text-sm bg-brand-primary text-white rounded-full px-5 py-2.5 hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? 'Preparando pago…' : cta}
      </button>
      {error && <p role="alert" className="font-brand text-sm text-red-600">{error}</p>}
    </div>
  )
}
