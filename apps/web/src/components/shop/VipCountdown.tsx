'use client'

import { useEffect, useState } from 'react'

/**
 * Countdown + aviso de acceso anticipado VIP (HU-291). 100% tokens de tema (sin
 * colores fijos): usa las variables brand-* del tema del tenant, así se "viste"
 * por plantilla. Accesible: el tiempo se anuncia con `aria-live="polite"` en
 * hitos (cada minuto) y no hay animación que dependa de movimiento.
 *
 * Variantes de superficie (HU-122a):
 *  - 'locked'  → panel "disponible pronto" para no-miembros (reemplaza el CTA).
 *  - 'member'  → cinta sutil "Acceso VIP activo" para miembros (sobre el CTA).
 */
function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 }
}

export default function VipCountdown({
  endsAt, campaignName, variant = 'locked',
}: {
  endsAt: string
  campaignName?: string
  variant?: 'locked' | 'member'
}) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const end = new Date(endsAt).getTime()
  const { d, h, m, s } = parts(end - now)
  const done = end - now <= 0
  const label = done
    ? 'La ventana de acceso anticipado ha terminado.'
    : `Cierra en ${d > 0 ? `${d}d ` : ''}${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`

  if (variant === 'member') {
    return (
      <div className="rounded-xl border border-brand-primary/20 bg-brand-primary/5 px-4 py-2 mb-3">
        <p className="font-brand text-sm text-brand-primary">
          <span className="font-semibold">★ Acceso VIP activo.</span>{' '}
          <span className="text-brand-primary/70" aria-live="polite">{label}</span>
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-brand-primary/15 bg-brand-cream/60 p-5 text-center">
      <p className="font-brand text-xs uppercase tracking-wide text-brand-primary/50">Acceso anticipado VIP</p>
      <p className="font-display text-brand-primary text-lg mt-1">Disponible pronto</p>
      <p className="font-brand text-sm text-brand-primary/60 mt-1">
        {campaignName ? `"${campaignName}" ` : ''}abre para miembros del Club VIP.
      </p>
      <p className="font-brand text-base font-semibold text-brand-primary mt-3" aria-live="polite" role="timer">{label}</p>
    </div>
  )
}
