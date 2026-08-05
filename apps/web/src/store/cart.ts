import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface CartItem {
  variantId: number
  productId?: number
  productSlug: string
  productName: string
  variantLabel: string
  price: number
  qty: number
  /** Stock disponible de la variante (para topar la cantidad en el carrito) */
  stock?: number
  /** Si el producto permite vender sin stock (backorder) */
  allowBackorder?: boolean
  imageUrl?: string
  /**
   * Legacy weight label — only used as last-resort fallback in shipping calc
   * when weight_kg is not set on the variant. For new products, configure
   * weight_kg on the variant instead.
   */
  weight?: string
  /** Real weight in kg (from product_variants.weight_kg) */
  weight_kg?: number | null
  /** Packed dimensions in cm (from product_variants.*_cm) */
  length_cm?: number | null
  width_cm?: number | null
  height_cm?: number | null
}

interface CartState {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (variantId: number) => void
  updateQty: (variantId: number, qty: number) => void
  clearCart: () => void
  total: () => number
  subtotal: () => number
  /** Sync local cart to DB (call on login) */
  syncToServer: () => Promise<void>
  /** Load cart from DB and merge with local (call on login) */
  loadFromServer: () => Promise<void>
}

/** Topa la cantidad al stock disponible, salvo que el producto permita backorder. */
function clampQty(qty: number, item: { stock?: number; allowBackorder?: boolean }): number {
  if (item.allowBackorder || item.stock == null) return Math.max(1, qty)
  return Math.max(1, Math.min(qty, item.stock))
}

/**
 * Consolida el carrito por variantId (sumando cantidades). Evita líneas
 * duplicadas para la misma variante — que romperían el unique constraint
 * (customer_id, variant_id) al sincronizar con la BD. Protege también contra
 * estados persistidos legacy con duplicados.
 */
function consolidateByVariant(items: CartItem[]): CartItem[] {
  const map = new Map<number, CartItem>()
  for (const it of items) {
    const prev = map.get(it.variantId)
    if (prev) prev.qty = clampQty(prev.qty + it.qty, prev)
    else map.set(it.variantId, { ...it, qty: clampQty(it.qty, it) })
  }
  return [...map.values()]
}

async function pushToServer(items: CartItem[]) {
  try {
    await fetch('/api/account/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    })
  } catch {
    // Non-critical: local state is still valid
  }
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          const existing = state.items.find((i) => i.variantId === item.variantId)
          const newItems = existing
            ? state.items.map((i) =>
                i.variantId === item.variantId ? { ...i, qty: clampQty(i.qty + item.qty, item) } : i
              )
            : [...state.items, { ...item, qty: clampQty(item.qty, item) }]
          return { items: newItems }
        })
        // Fire-and-forget sync
        pushToServer(get().items)
      },

      removeItem: (variantId) => {
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        }))
        pushToServer(get().items)
      },

      updateQty: (variantId, qty) => {
        if (qty <= 0) {
          get().removeItem(variantId)
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.variantId === variantId ? { ...i, qty: clampQty(qty, i) } : i
          ),
        }))
        pushToServer(get().items)
      },

      clearCart: () => {
        set({ items: [] })
        try {
          fetch('/api/account/cart', { method: 'DELETE' }).catch(() => {})
        } catch { /* non-critical */ }
      },

      subtotal: () =>
        get().items.reduce((acc, i) => acc + i.price * i.qty, 0),

      total: () => get().subtotal(),

      syncToServer: async () => {
        const { items } = get()
        if (items.length > 0) await pushToServer(items)
      },

      loadFromServer: async () => {
        try {
          const res = await fetch('/api/account/cart')
          if (!res.ok) return
          const { items: serverItems } = await res.json()
          if (!serverItems?.length) return

          // Merge: local items take precedence for qty, server adds missing items
          const local = get().items
          const merged = [...local]
          for (const si of serverItems) {
            const localItem = merged.find((i) => i.variantId === si.variant_id)
            if (!localItem) {
              merged.push({
                variantId: si.variant_id,
                productId: si.product_id,
                productSlug: '',   // not stored in DB; will be resolved on next visit
                productName: si.product_name,
                variantLabel: si.variant_label,
                price: Number(si.price),
                qty: si.qty,
                imageUrl: si.image_url ?? undefined,
                weight: undefined,
              })
            }
          }
          set({ items: consolidateByVariant(merged) })
        } catch { /* non-critical */ }
      },
    }),
    {
      name: 'vps-cart',
      storage: createJSONStorage(() => localStorage),
      // Limpia duplicados por variante en estados persistidos legacy al rehidratar.
      onRehydrateStorage: () => (state) => {
        if (state?.items?.length) {
          state.items = consolidateByVariant(state.items)
        }
      },
    }
  )
)
