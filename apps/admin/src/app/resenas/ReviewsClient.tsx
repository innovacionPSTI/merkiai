'use client'

import { useState } from 'react'
import { PageHeader, Icon, StatusBadge, type BadgeTone } from '@merkiai/ui'
import type { ProductReview } from '@merkiai/database'

const TABS: { key: 'pending' | 'approved' | 'rejected'; label: string }[] = [
  { key: 'pending', label: 'Pendientes' },
  { key: 'approved', label: 'Aprobadas' },
  { key: 'rejected', label: 'Rechazadas' },
]
const TONE: Record<string, BadgeTone> = { pending: 'warn', approved: 'success', rejected: 'neutral' }

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex text-amber-500">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={13} height={13} viewBox="0 0 24 24" fill={i <= n ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5}>
          <path d="M12 17.3 6.2 20.6l1.1-6.5L2.6 9.5l6.5-.9L12 2.7l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5z" strokeLinejoin="round" />
        </svg>
      ))}
    </span>
  )
}

export default function ReviewsClient({ initial, productNames }: { initial: ProductReview[]; productNames: Record<number, string> }) {
  const [reviews, setReviews] = useState(initial)
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [busy, setBusy] = useState<number | null>(null)

  const counts = {
    pending: reviews.filter((r) => r.status === 'pending').length,
    approved: reviews.filter((r) => r.status === 'approved').length,
    rejected: reviews.filter((r) => r.status === 'rejected').length,
  }
  const list = reviews.filter((r) => r.status === tab)

  async function setStatus(id: number, status: 'approved' | 'rejected' | 'pending') {
    setBusy(id)
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }),
      })
      if (res.ok) setReviews((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)))
    } finally { setBusy(null) }
  }
  async function remove(id: number) {
    if (!confirm('¿Eliminar esta reseña? No se puede deshacer.')) return
    setBusy(id)
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, { method: 'DELETE' })
      if (res.ok) setReviews((rs) => rs.filter((r) => r.id !== id))
    } finally { setBusy(null) }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Reseñas" description="Modera las reseñas de productos antes de publicarlas." />

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`font-brand text-sm px-4 py-2 rounded-xl transition-colors ${tab === t.key ? 'bg-brand-primary text-brand-cream' : 'bg-white text-brand-primary hover:bg-brand-cream'}`}>
            {t.label} <span className="opacity-60">({counts[t.key]})</span>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <p className="font-brand text-sm text-brand-primary/40">Sin reseñas {TABS.find((t) => t.key === tab)?.label.toLowerCase()}.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((r) => (
            <li key={r.id} className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Stars n={r.rating} />
                    <span className="font-brand text-sm font-semibold text-brand-primary">{r.author_name}</span>
                    <StatusBadge tone={TONE[r.status]}>{r.status}</StatusBadge>
                  </div>
                  <a href={`/productos/${r.product_id}`} className="font-brand text-xs text-brand-primary/50 hover:text-brand-primary underline">
                    {productNames[r.product_id] ?? `Producto #${r.product_id}`}
                  </a>
                  {r.title && <p className="font-brand text-sm font-semibold text-brand-primary mt-1">{r.title}</p>}
                  {r.body && <p className="font-brand text-sm text-brand-primary/70 mt-1 whitespace-pre-line">{r.body}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {r.status !== 'approved' && (
                    <button onClick={() => setStatus(r.id, 'approved')} disabled={busy === r.id}
                      className="font-brand text-xs bg-green-600 text-white rounded-lg px-3 py-1.5 hover:bg-green-700 disabled:opacity-50">Aprobar</button>
                  )}
                  {r.status !== 'rejected' && (
                    <button onClick={() => setStatus(r.id, 'rejected')} disabled={busy === r.id}
                      className="font-brand text-xs border border-gray-300 text-brand-primary rounded-lg px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50">Rechazar</button>
                  )}
                  <button onClick={() => remove(r.id)} disabled={busy === r.id} title="Eliminar" aria-label="Eliminar"
                    className="text-brand-primary/40 hover:text-red-600"><Icon name="trash" size={16} /></button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
