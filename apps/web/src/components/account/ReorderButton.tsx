'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart'

interface ReorderItem { variant_id: number; qty: number; variant_label: string; product_name: string }
interface CartVariantInfo {
  variant_id: number; product_id: number; slug: string; product_name: string
  price: number; stock: number; allow_backorder: boolean; image_url: string | null
  weight: string | null; weight_kg: number | null; length_cm: number | null; width_cm: number | null; height_cm: number | null
}

/**
 * HU-112 · "Repetir pedido". Re-agrega al carrito los ítems del pedido que
 * siguen disponibles (activos + con stock o backorder), respetando los topes de
 * stock; omite los descontinuados/agotados con aviso. Luego lleva al carrito.
 */
export default function ReorderButton({ items }: { items: ReorderItem[] }) {
  const router = useRouter()
  const addItem = useCartStore((s) => s.addItem)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function reorder() {
    setLoading(true); setMsg(null)
    try {
      const ids = [...new Set(items.map((i) => i.variant_id))].join(',')
      const res = await fetch(`/api/catalog/variants?ids=${ids}`)
      const data = await res.json()
      const info: CartVariantInfo[] = Array.isArray(data.variants) ? data.variants : []
      const byId = new Map(info.map((v) => [v.variant_id, v]))

      let added = 0, skipped = 0
      for (const it of items) {
        const v = byId.get(it.variant_id)
        const available = v && (v.allow_backorder || v.stock > 0)
        if (!v || !available) { skipped++; continue }
        const qty = v.allow_backorder ? it.qty : Math.min(it.qty, v.stock)
        if (qty <= 0) { skipped++; continue }
        addItem({
          variantId: v.variant_id,
          productId: v.product_id,
          productSlug: v.slug,
          productName: v.product_name,
          variantLabel: it.variant_label,
          price: v.price,
          qty,
          stock: v.stock,
          allowBackorder: v.allow_backorder,
          imageUrl: v.image_url ?? undefined,
          weight: v.weight ?? undefined,
          weight_kg: v.weight_kg ?? null,
          length_cm: v.length_cm ?? null,
          width_cm: v.width_cm ?? null,
          height_cm: v.height_cm ?? null,
        })
        added++
      }

      if (added === 0) { setMsg('Ninguno de los productos de este pedido está disponible ahora.'); setLoading(false); return }
      if (skipped > 0) setMsg(`${added} producto(s) agregado(s); ${skipped} no disponible(s).`)
      router.push('/cart')
    } catch {
      setMsg('No se pudo repetir el pedido.'); setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={reorder}
        disabled={loading}
        className="inline-flex items-center gap-2 font-brand text-sm bg-brand-primary text-brand-cream rounded-full px-5 py-2.5 hover:bg-brand-dark transition-colors disabled:opacity-50"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M3 2v6h6M21 12A9 9 0 1 1 6 5.3L3 8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {loading ? 'Agregando…' : 'Repetir pedido'}
      </button>
      {msg && <p className="font-brand text-xs text-amber-600 mt-2">{msg}</p>}
    </div>
  )
}
