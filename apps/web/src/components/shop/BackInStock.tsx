'use client'

import { useState } from 'react'

/**
 * HU-105 · "Avísame cuando vuelva". Se muestra en la PDP cuando la variante
 * seleccionada está agotada y no permite backorder. Guarda el correo del
 * comprador para avisarle al reponer stock. Estilos por tokens de tema.
 */
export default function BackInStock({ variantId }: { variantId: number }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setState('loading'); setError('')
    try {
      const res = await fetch('/api/stock-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variant_id: variantId, email }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? 'No se pudo registrar el aviso.'); setState('error'); return }
      setState('done')
    } catch {
      setError('No se pudo registrar el aviso.'); setState('error')
    }
  }

  if (state === 'done') {
    return (
      <div className="rounded-2xl border border-brand-primary/15 p-4 mb-6">
        <p className="font-brand text-sm text-brand-primary">
          Listo, te avisaremos a <strong>{email}</strong> cuando vuelva a estar disponible.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-brand-primary/15 p-4 mb-6">
      <p className="font-brand text-sm font-semibold text-brand-primary mb-1">Avísame cuando vuelva</p>
      <p className="font-brand text-xs text-brand-primary/50 mb-3">
        Déjanos tu correo y te escribimos apenas tengamos stock de esta opción.
      </p>
      <div className="flex flex-wrap gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          aria-label="Correo electrónico"
          className="flex-1 min-w-[10rem] border border-brand-primary/20 rounded-full px-4 py-2 font-brand text-sm text-brand-primary focus:outline-none focus:border-brand-primary"
        />
        <button
          type="submit"
          disabled={state === 'loading'}
          className="shrink-0 rounded-full bg-brand-primary text-brand-cream px-5 py-2 font-brand text-sm font-medium hover:bg-brand-dark disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {state === 'loading' ? 'Enviando…' : 'Avisarme'}
        </button>
      </div>
      {error && <p className="font-brand text-xs text-amber-600 mt-2">{error}</p>}
    </form>
  )
}
