'use client'

/**
 * Reviews — reseñas y calificaciones de producto (HU-101). Muestra el promedio
 * en estrellas + la lista de reseñas aprobadas y un formulario para dejar una
 * nueva (se envía a moderación → `/api/reviews`).
 */
import { useState } from 'react'
import type { ProductReview, ReviewStats } from '@merkiai/database'

const PAGE = 5

function Stars({ value, size = 16, onPick }: { value: number; size?: number; onPick?: (n: number) => void }) {
  return (
    <span className="inline-flex" role={onPick ? 'radiogroup' : undefined} aria-label="Calificación">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onPick}
          onClick={() => onPick?.(n)}
          aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
          className={onPick ? 'cursor-pointer' : 'cursor-default'}
        >
          <svg width={size} height={size} viewBox="0 0 24 24"
            fill={n <= Math.round(value) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5}
            className="text-amber-500">
            <path d="M12 17.3 6.2 20.6l1.1-6.5L2.6 9.5l6.5-.9L12 2.7l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5z" strokeLinejoin="round" />
          </svg>
        </button>
      ))}
    </span>
  )
}

export default function Reviews({ productId, stats, initialReviews, total = initialReviews.length }: {
  productId: number
  stats: ReviewStats
  initialReviews: ProductReview[]
  /** HU-101 v2 · total de reseñas aprobadas (para "Cargar más"). */
  total?: number
}) {
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [rating, setRating] = useState(5)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  // HU-101 v2 · lista paginada + votos "útil".
  const [reviews, setReviews] = useState<ProductReview[]>(initialReviews)
  const [loadingMore, setLoadingMore] = useState(false)
  const [voted, setVoted] = useState<Record<number, boolean>>({})
  const [helpful, setHelpful] = useState<Record<number, number>>(
    () => Object.fromEntries(initialReviews.map((r) => [r.id, r.helpful_count ?? 0])),
  )

  async function loadMore() {
    setLoadingMore(true)
    try {
      const res = await fetch(`/api/reviews?product_id=${productId}&offset=${reviews.length}&limit=${PAGE}`)
      const data = await res.json()
      if (res.ok && Array.isArray(data.reviews)) {
        setReviews((prev) => [...prev, ...data.reviews])
        setHelpful((prev) => ({ ...prev, ...Object.fromEntries(data.reviews.map((r: ProductReview) => [r.id, r.helpful_count ?? 0])) }))
      }
    } finally { setLoadingMore(false) }
  }

  async function voteHelpful(id: number) {
    if (voted[id]) return
    const key = `merkiai-review-helpful`
    try {
      const store = JSON.parse(localStorage.getItem(key) ?? '{}') as Record<string, boolean>
      if (store[id]) { setVoted((v) => ({ ...v, [id]: true })); return }
      setVoted((v) => ({ ...v, [id]: true }))
      setHelpful((h) => ({ ...h, [id]: (h[id] ?? 0) + 1 }))
      const res = await fetch('/api/reviews/helpful', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        store[id] = true
        localStorage.setItem(key, JSON.stringify(store))
        if (typeof data.helpful_count === 'number') setHelpful((h) => ({ ...h, [id]: data.helpful_count }))
      } else {
        // revertir si falló
        setVoted((v) => ({ ...v, [id]: false }))
        setHelpful((h) => ({ ...h, [id]: Math.max(0, (h[id] ?? 1) - 1) }))
      }
    } catch { /* no-op */ }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('Escribe tu nombre.'); return }
    setSending(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, author_name: name, rating, body }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'No se pudo enviar la reseña.'); return }
      setDone(true); setShowForm(false); setName(''); setBody(''); setRating(5)
    } finally { setSending(false) }
  }

  const fmtDate = (s: string) => new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(new Date(s))

  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-brand-primary/10">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h2 className="font-display text-brand-primary text-2xl">Reseñas</h2>
          {stats.count > 0 ? (
            <div className="flex items-center gap-2 mt-1">
              <Stars value={stats.average} />
              <span className="font-brand text-sm text-brand-primary/60">
                {stats.average.toFixed(1)} · {stats.count} {stats.count === 1 ? 'reseña' : 'reseñas'}
              </span>
            </div>
          ) : (
            <p className="font-brand text-sm text-brand-primary/50 mt-1">Aún no hay reseñas. ¡Sé el primero!</p>
          )}
        </div>
        {!showForm && !done && (
          <button onClick={() => setShowForm(true)}
            className="font-brand text-sm border border-brand-primary text-brand-primary rounded-full px-5 py-2 hover:bg-brand-primary hover:text-brand-cream transition-colors">
            Escribir una reseña
          </button>
        )}
      </div>

      {done && (
        <p className="font-brand text-sm text-green-700 bg-green-50 rounded-xl px-4 py-3 mb-6">
          ¡Gracias! Tu reseña fue enviada y se publicará tras revisión.
        </p>
      )}

      {showForm && (
        <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm p-5 space-y-4 mb-8">
          <div>
            <label className="font-brand text-xs text-brand-primary/50 block mb-1">Tu calificación</label>
            <Stars value={rating} size={24} onPick={setRating} />
          </div>
          <div>
            <label className="font-brand text-xs text-brand-primary/50 block mb-1">Tu nombre *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="font-brand text-xs text-brand-primary/50 block mb-1">Tu comentario</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} maxLength={2000}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary resize-none" />
          </div>
          {error && <p className="font-brand text-sm text-red-500">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={sending}
              className="font-brand text-sm bg-brand-primary text-brand-cream rounded-full px-5 py-2.5 hover:bg-brand-dark transition-colors disabled:opacity-50">
              {sending ? 'Enviando…' : 'Enviar reseña'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="font-brand text-sm border border-gray-200 text-brand-primary rounded-full px-5 py-2.5 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {reviews.length > 0 && (
        <ul className="space-y-5">
          {reviews.map((r) => (
            <li key={r.id} className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Stars value={r.rating} size={14} />
                  <span className="font-brand text-sm font-semibold text-brand-primary">{r.author_name}</span>
                </div>
                <span className="font-brand text-xs text-brand-primary/40">{fmtDate(r.created_at)}</span>
              </div>
              {r.title && <p className="font-brand text-sm font-semibold text-brand-primary mt-2">{r.title}</p>}
              {r.body && <p className="font-brand text-sm text-brand-primary/70 mt-1 whitespace-pre-line">{r.body}</p>}
              {/* HU-101 v2 · voto útil */}
              <button
                type="button"
                onClick={() => voteHelpful(r.id)}
                disabled={!!voted[r.id]}
                aria-pressed={!!voted[r.id]}
                className={`mt-3 inline-flex items-center gap-1.5 font-brand text-xs rounded-full px-3 py-1.5 border transition-colors ${
                  voted[r.id]
                    ? 'border-brand-primary/30 text-brand-primary/50 cursor-default'
                    : 'border-brand-primary/20 text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5'
                }`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M7 10v11M2 11h5v10H2zM20 10h-6l1-5a2 2 0 0 0-2-2l-3 7v9h9a2 2 0 0 0 2-2l1-6a2 2 0 0 0-2-2z" strokeLinejoin="round" />
                </svg>
                {voted[r.id] ? 'Gracias' : 'Útil'}{(helpful[r.id] ?? 0) > 0 ? ` · ${helpful[r.id]}` : ''}
              </button>
            </li>
          ))}
        </ul>
      )}

      {reviews.length < total && (
        <div className="text-center mt-6">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="font-brand text-sm border border-brand-primary text-brand-primary rounded-full px-6 py-2.5 hover:bg-brand-primary hover:text-brand-cream transition-colors disabled:opacity-50"
          >
            {loadingMore ? 'Cargando…' : `Cargar más (${total - reviews.length})`}
          </button>
        </div>
      )}
    </section>
  )
}
