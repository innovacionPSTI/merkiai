'use client'

import { useState } from 'react'

/**
 * HU-287 · Compartir producto. Usa la Web Share API nativa cuando está
 * disponible (móvil); en escritorio ofrece copiar el enlace y WhatsApp.
 * Agnóstico de nicho; estilos por tokens de tema. El enlace es la URL actual
 * (canónica del producto), sin exponer datos del comprador.
 */
export default function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)

  const shareUrl = () => (typeof window !== 'undefined' ? window.location.href : '')

  async function nativeShare() {
    const url = shareUrl()
    // navigator.share solo existe en contextos seguros/compatibles (móvil).
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share({ title, url })
        return
      } catch {
        /* usuario canceló: caer al menú */
      }
    }
    setOpen((v) => !v)
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard no disponible */
    }
  }

  const whatsappHref = () =>
    `https://wa.me/?text=${encodeURIComponent(`${title} ${shareUrl()}`)}`

  return (
    <div className="relative">
      <button
        type="button"
        onClick={nativeShare}
        className="w-full inline-flex items-center justify-center gap-2 border border-brand-primary/30 text-brand-primary rounded-full py-3 font-brand text-sm font-medium transition-colors hover:border-brand-primary hover:bg-brand-primary/5"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        Compartir
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full rounded-2xl border border-brand-primary/15 bg-white shadow-card p-2 flex flex-col gap-1">
          <a
            href={whatsappHref()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="font-brand text-sm text-brand-primary rounded-xl px-3 py-2 hover:bg-brand-primary/5 text-left"
          >
            WhatsApp
          </a>
          <button
            type="button"
            onClick={() => { copyLink(); setOpen(false) }}
            className="font-brand text-sm text-brand-primary rounded-xl px-3 py-2 hover:bg-brand-primary/5 text-left"
          >
            {copied ? 'Enlace copiado' : 'Copiar enlace'}
          </button>
        </div>
      )}
      {copied && !open && (
        <p className="font-brand text-xs text-green-600 mt-1 text-center">Enlace copiado</p>
      )}
    </div>
  )
}
