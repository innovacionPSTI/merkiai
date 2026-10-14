import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

/**
 * Vistos recientemente (HU-286). Client-side, persistido en localStorage (por
 * origen = por tenant, sin PII). Se registra al abrir una PDP y se muestra como
 * carrusel en la propia PDP. Agnóstico de nicho; reutilizable en otras tiendas.
 */
export interface RecentItem {
  id: number
  slug: string
  name: string
  imageUrl?: string | null
  price?: number | null
}

const MAX_ITEMS = 12

interface RecentlyViewedState {
  items: RecentItem[]
  /** Registra una vista: mueve al frente, deduplica por id y limita el tamaño. */
  record: (item: RecentItem) => void
  clear: () => void
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      items: [],
      record: (item) =>
        set((s) => ({
          items: [item, ...s.items.filter((i) => i.id !== item.id)].slice(0, MAX_ITEMS),
        })),
      clear: () => set({ items: [] }),
    }),
    {
      name: 'merkiai-recently-viewed',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
