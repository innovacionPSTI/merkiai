'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useWishlistStore } from '@/store/wishlist'

/** Enlace a /wishlist con contador (guard de hidratación). HU-103. */
export default function WishlistNavLink() {
  const count = useWishlistStore((s) => s.items.length)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <Link href="/wishlist" aria-label="Favoritos" className="relative p-2 text-brand-primary hover:text-brand-dark transition-colors">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
      </svg>
      {mounted && count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-primary text-brand-cream text-[10px] font-bold flex items-center justify-center">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  )
}
