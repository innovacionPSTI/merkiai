'use client'

/**
 * Página de favoritos (HU-103). Lee la lista de deseos de `useWishlistStore`
 * (localStorage). Muestra los productos guardados con enlace a la PDP y quitar.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useWishlistStore } from '@/store/wishlist'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

export default function WishlistPage() {
  const items = useWishlistStore((s) => s.items)
  const remove = useWishlistStore((s) => s.remove)
  const clear = useWishlistStore((s) => s.clear)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div className="min-h-screen bg-brand-cream pt-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="font-display text-brand-primary text-section">Favoritos</h1>
            <p className="font-brand text-sm text-brand-primary/50 mt-1">
              {mounted ? `${items.length} ${items.length === 1 ? 'producto guardado' : 'productos guardados'}` : '—'}
            </p>
          </div>
          {mounted && items.length > 0 && (
            <button onClick={clear} className="font-brand text-xs text-brand-primary/40 hover:text-brand-primary underline">
              Vaciar lista
            </button>
          )}
        </div>

        {!mounted ? null : items.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-brand text-brand-primary/40 text-xl mb-4">Aún no tienes favoritos.</p>
            <Link href="/shop" className="font-brand text-sm text-brand-primary underline">Explorar el catálogo</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((p) => (
              <div key={p.id} className="relative bg-white rounded-2xl overflow-hidden shadow-card">
                <Link href={`/shop/${p.slug}`} className="block relative overflow-hidden bg-brand-cream-warm h-48">
                  {p.imageUrl
                    ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                    : <span className="flex items-center justify-center w-full h-full font-display text-brand-primary/10 text-6xl">▲</span>}
                </Link>
                <button
                  onClick={() => remove(p.id)}
                  aria-label="Quitar de favoritos"
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-brand-primary/50 hover:text-red-500"
                >
                  ✕
                </button>
                <div className="p-4">
                  <Link href={`/shop/${p.slug}`}>
                    <h3 className="font-brand text-base font-semibold text-brand-primary line-clamp-1 hover:text-brand-dark transition-colors">{p.name}</h3>
                  </Link>
                  {p.price != null && <p className="font-brand font-bold text-brand-price mt-1">{fmt(p.price)}</p>}
                  <Link
                    href={`/shop/${p.slug}`}
                    className="mt-3 inline-block w-full text-center border border-brand-primary text-brand-primary rounded-full py-2 font-brand text-sm hover:bg-brand-primary hover:text-brand-cream transition-colors"
                  >
                    Ver producto
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
