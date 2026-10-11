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
      },
      add: (item) =>
        set((s) => (s.items.some((i) => i.id === item.id) ? s : { items: [item, ...s.items] })),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      has: (id) => get().items.some((i) => i.id === id),
      clear: () => set({ items: [] }),
      count: () => get().items.length,
    }),
    {
      name: 'merkiai-wishlist',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
