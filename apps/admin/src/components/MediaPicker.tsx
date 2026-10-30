'use client'

/**
 * MediaPicker (HU-357) — selector reutilizable de la biblioteca de medios.
 *
 * Modal que lista los `media_assets` del tenant (vía /api/admin/media, acotado
 * por RLS) para **reutilizar** un recurso ya subido desde cualquier campo de
 * imagen/archivo, sin re-subirlo. Búsqueda por nombre/alt. Genérico.
 */
import { useEffect, useMemo, useState } from 'react'
import { Icon } from '@merkiai/ui'

interface Asset { key: string; url: string; alt_text?: string | null; mime_type?: string | null }

export default function MediaPicker({
  open, onClose, onSelect, mime = 'image',
}: {
  open: boolean
  onClose: () => void
  onSelect: (url: string, asset: Asset) => void
  /** Prefijo de mime a filtrar ('image', 'application', '' = todo). */
  mime?: string
}) {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState('')

  useEffect(() => {
    if (!open) return
    setLoading(true)
    const qs = mime ? `?mime=${encodeURIComponent(mime)}` : ''
    fetch(`/api/admin/media${qs}`)
      .then((r) => r.ok ? r.json() : { assets: [] })
      .then((d) => setAssets(d.assets ?? []))
      .finally(() => setLoading(false))
  }, [open, mime])

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return assets
    return assets.filter((a) => `${a.key} ${a.alt_text ?? ''}`.toLowerCase().includes(t))
  }, [assets, q])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-3xl max-h-[80vh] overflow-hidden rounded-2xl bg-white shadow-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
          <p className="font-brand text-sm font-semibold text-brand-primary">Biblioteca de medios</p>
          <input
            value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o alt…"
            className="ml-auto w-56 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm" aria-label="Buscar medios"
          />
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700" title="Cerrar" aria-label="Cerrar"><Icon name="close" size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="text-sm text-slate-400 text-center py-10">Cargando…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-10">No hay medios {q ? 'que coincidan' : 'aún'}.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {filtered.map((a) => (
                <button
                  key={a.key} type="button"
                  onClick={() => { onSelect(a.url, a); onClose() }}
                  className="group rounded-xl overflow-hidden border border-slate-200 hover:border-indigo-400 hover:ring-2 hover:ring-indigo-200 text-left"
                  title={a.alt_text || a.key}
                >
                  <div className="h-24 bg-brand-cream overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.url} alt={a.alt_text || a.key} className="w-full h-full object-cover" />
                  </div>
                  <p className="truncate px-2 py-1 text-[11px] text-slate-500">{a.alt_text || a.key}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
