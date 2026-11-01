'use client'

import { useState } from 'react'
import { useCartStore } from '@/store/cart'
import { useEcommerceEnabled } from '@/components/EcommerceProvider'

interface Props {
  bundle: { id: number; slug: string; name: string; price: number; maxQty: number; imageUrl: string | null }
}

/**
 * HU-168 · agrega un bundle al carrito como una línea única. El `variantId` es un
 * sentinel negativo (-id) para convivir con el carrito keyed-by-variant; el
 * servidor expande a los componentes en el checkout (stock por componente).
 */
export default function AddBundleButton({ bundle }: Props) {
  const addItem = useCartStore((s) => s.addItem)
  const ecommerceEnabled = useEcommerceEnabled() // HU-173 · modo vitrina
  const [added, setAdded] = useState(false)

  function add() {
    addItem({
      variantId: -bundle.id,
      bundleId: bundle.id,
      productSlug: `bundles/${bundle.slug}`,
      productName: bundle.name,
      variantLabel: 'Kit',
      price: bundle.price,
      qty: 1,
      stock: bundle.maxQty,
      allowBackorder: false,
      imageUrl: bundle.imageUrl ?? undefined,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (!ecommerceEnabled) return null

  return (
    <button
      onClick={add}
      className={`w-full rounded-full py-4 font-brand font-medium transition-all ${added ? 'bg-green-600 text-white' : 'bg-brand-primary text-brand-cream hover:bg-brand-dark'}`}
    >
      {added ? 'Agregado al carrito' : 'Agregar kit al carrito'}
    </button>
  )
}
