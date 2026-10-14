'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRecentlyViewedStore, type RecentItem } from '@/store/recentlyViewed'

/**
 * HU-286 · "Vistos recientemente". Registra el producto actual al montar y
 * muestra el resto como carrusel (excluye el actual). Client-side (localStorage
 * por origen), sin PII. Estilos solo con tokens de tema. Reutilizable.
 */
export default function RecentlyViewed({ current }: { current: RecentItem }) {
  const items = useRecentlyViewedStore((s) => s.items)
  const record = useRecentlyViewedStore((s) => s.record)
  const [hydrated, setHydrated] = useState(false)

  // Guard de hidratación: el store persistido no está disponible en el primer
  // render del servidor; evita desajustes de SSR.
  useEffect(() => setHydrated(true), [])

  useEffect(() => {
    record(current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.id])

  if (!hydrated) return null
  const others = items.filter((i) => i.id !== current.id)
  if (others.length === 0) return null

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <h2 className="font-display text-brand-primary text-section mb-6">Vistos recientemente</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
        {others.map((p) => (
          <Link
            key={p.id}
            href={`/shop/${p.slug}`}
            className="group shrink-0 w-40 snap-start bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow"
          >
            <div className="h-32 bg-brand-cream overflow-hidden">
              {p.imageUrl ? (
                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="font-display text-brand-primary/10 text-3xl">▲</span>
                </div>
              )}
            </div>
            <div className="p-3">
              <p className="font-brand text-sm text-brand-primary truncate">{p.name}</p>
              {p.price != null && (
                <p className="font-brand font-bold text-brand-primary text-sm mt-0.5">{fmt(p.price)}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
