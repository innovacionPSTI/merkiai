'use client'

import { useState } from 'react'
import { Icon } from '@merkiai/ui'
import { getPreviewUrlAction } from './preview-action'

/** Botón "Vista previa": abre la tienda en modo borrador en una pestaña nueva (HU-128). */
export default function PreviewButton({ path = '/' }: { path?: string }) {
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  async function open() {
    setLoading(true); setErr('')
    const r = await getPreviewUrlAction(path)
    setLoading(false)
    if (r.url) window.open(r.url, '_blank', 'noopener,noreferrer')
    else setErr(r.error ?? 'Error')
  }

  return (
    <div className="flex items-center gap-2">
      {err && <span className="font-brand text-xs text-red-500 max-w-[260px]">{err}</span>}
      <button
        onClick={open}
        disabled={loading}
        className="font-brand text-sm border border-brand-primary text-brand-primary rounded-xl px-4 py-2 hover:bg-brand-primary hover:text-brand-cream transition-colors inline-flex items-center gap-2 disabled:opacity-50"
      >
        <Icon name="external" size={16} /> {loading ? 'Generando…' : 'Vista previa'}
      </button>
    </div>
  )
}
