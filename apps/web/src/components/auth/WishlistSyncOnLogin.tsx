'use client'

import { useEffect, useRef } from 'react'
import { useUser } from '@stackframe/stack'
import { useWishlistStore } from '@/store/wishlist'

/**
 * HU-103 v2 · Fusiona la lista de deseos al iniciar sesión.
 * - Al loguearse: sube los favoritos locales a la cuenta (merge) y luego baja
 *   los de la cuenta y los fusiona en el estado local.
 * - Al salir: sin acción (el localStorage persiste para la próxima sesión).
 * Montar dentro de StackProvider (área cliente del layout raíz).
 */
export default function WishlistSyncOnLogin() {
  const user = useUser({ or: 'return-null' })
  const syncToServer = useWishlistStore((s) => s.syncToServer)
  const loadFromServer = useWishlistStore((s) => s.loadFromServer)
  const prevUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    const currentId = user?.id ?? null
    if (currentId && currentId !== prevUserIdRef.current) {
      syncToServer().then(() => loadFromServer())
    }
    prevUserIdRef.current = currentId
  }, [user?.id, syncToServer, loadFromServer])

  return null
}
