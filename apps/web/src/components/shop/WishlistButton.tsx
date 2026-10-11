'use client'

/**
 * WishlistButton — corazón para guardar/quitar un producto de favoritos (HU-103).
 * Usa el store `useWishlistStore` (localStorage). Guard de hidratación para no
 * desajustar el SSR (el estado real solo se refleja tras montar en cliente).
 */
import { useEffect, useState } from 'react'
import { useWishlistStore, type WishlistItem } from '@/store/wishlist'

export default function WishlistButton({
  item,
  size = 18,
  className = '',
  variant = 'icon',
}: {
  item: WishlistItem
  size?: number
  className?: string
  /** 'icon' = solo corazón (overlay en tarjetas); 'button' = con texto (PDP). */
  variant?: 'icon' | 'button'
}) {
  const toggle = useWishlistStore((s) => s.toggle)
  const items = useWishlistStore((s) => s.items)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const saved = mounted && items.some((i) => i.id === item.id)

  const heart = (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
    </svg>
  )

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={() => toggle(item)}
        aria-pressed={saved}
        className={`inline-flex items-center gap-2 font-brand text-sm rounded-full px-4 py-2 border transition-colors ${
          saved ? 'border-brand-primary text-brand-primary bg-brand-cream/50' : 'border-brand-primary/20 text-brand-primary hover:border-brand-primary'
        } ${className}`}
      >
        <span className="text-brand-primary">{heart}</span>
        {saved ? 'Guardado' : 'Guardar'}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(item) }}
      aria-label={saved ? 'Quitar de favoritos' : 'Guardar en favoritos'}
      aria-pressed={saved}
      title={saved ? 'Quitar de favoritos' : 'Guardar en favoritos'}
      className={`flex items-center justify-center w-8 h-8 rounded-full bg-white/90 shadow-sm backdrop-blur transition-colors ${
        saved ? 'text-brand-primary' : 'text-brand-primary/50 hover:text-brand-primary'
      } ${className}`}
    >
      {heart}
    </button>
  )
}
