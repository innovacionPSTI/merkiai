import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

/**
 * Lista de deseos / favoritos (HU-103). v1 client-side: persistida en
 * localStorage (por origen = por tenant). Sirve para invitados y logueados.
 * (v2: sincronizar con BD por `customer_id` al iniciar sesión.)
 */
export interface WishlistItem {
  /** id del producto (clave estable del favorito). */
  id: number
  slug: string
  name: string
  imageUrl?: string | null
  /** Precio "desde" para mostrar en la lista (min_price). */
  price?: number | null
}

interface WishlistState {
  items: WishlistItem[]
  /** Agrega o quita según esté presente; devuelve el nuevo estado (true = guardado). */
  toggle: (item: WishlistItem) => void
  add: (item: WishlistItem) => void
  remove: (id: number) => void
  has: (id: number) => boolean
  clear: () => void
  count: () => number
  /** HU-103 v2 · fusiona los favoritos locales en la cuenta (al iniciar sesión). */
  syncToServer: () => Promise<void>
  /** HU-103 v2 · trae los favoritos de la cuenta y los fusiona en el estado local. */
  loadFromServer: () => Promise<void>
}

// Sincronización best-effort con la cuenta (HU-103 v2). Si falla (invitado o
// red), el estado local sigue siendo válido.
function pushAdd(productId: number) {
  if (typeof fetch === 'undefined') return
  try {
    fetch('/api/account/wishlist', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_ids: [productId] }),
    }).catch(() => {})
  } catch { /* non-critical */ }
}
function pushRemove(productId: number) {
  if (typeof fetch === 'undefined') return
  try {
    fetch('/api/account/wishlist', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId }),
    }).catch(() => {})
  } catch { /* non-critical */ }
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (item) => {
        const exists = get().items.some((i) => i.id === item.id)
        set((s) => ({
          items: exists ? s.items.filter((i) => i.id !== item.id) : [item, ...s.items],
        }))
        if (exists) pushRemove(item.id); else pushAdd(item.id)
      },
      add: (item) => {
        if (get().items.some((i) => i.id === item.id)) return
        set((s) => ({ items: [item, ...s.items] }))
        pushAdd(item.id)
      },
      remove: (id) => { set((s) => ({ items: s.items.filter((i) => i.id !== id) })); pushRemove(id) },
      has: (id) => get().items.some((i) => i.id === id),
      clear: () => set({ items: [] }),
      count: () => get().items.length,

      syncToServer: async () => {
        const ids = get().items.map((i) => i.id)
        if (ids.length === 0) return
        try {
          await fetch('/api/account/wishlist', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_ids: ids }),
          })
        } catch { /* non-critical */ }
      },

      loadFromServer: async () => {
        try {
          const res = await fetch('/api/account/wishlist')
          if (!res.ok) return
          const { items: serverItems } = await res.json()
          if (!Array.isArray(serverItems)) return
          const local = get().items
          const merged = [...local]
          for (const s of serverItems) {
            if (!merged.some((i) => i.id === s.id)) {
              merged.push({ id: s.id, slug: s.slug, name: s.name, imageUrl: s.imageUrl ?? null, price: s.price ?? null })
            }
          }
          set({ items: merged })
        } catch { /* non-critical */ }
      },
    }),
    {
      name: 'merkiai-wishlist',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
