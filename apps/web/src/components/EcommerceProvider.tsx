'use client'

/**
 * EcommerceProvider (HU-173) — propaga a los componentes cliente si la tienda
 * tiene habilitado el **peldaño e-commerce**. En modo "vitrina/catálogo"
 * (`enabled=false`) las superficies de compra ocultan el botón "Agregar al
 * carrito" (la barrera dura ya vive en el checkout API y la página /checkout).
 *
 * Default `true` (fail-open): un componente montado fuera del provider se
 * comporta como tienda normal, para no romper rutas que no lo envuelven.
 */
import { createContext, useContext } from 'react'

const EcommerceContext = createContext<boolean>(true)

export function EcommerceProvider({ enabled, children }: { enabled: boolean; children: React.ReactNode }) {
  return <EcommerceContext.Provider value={enabled}>{children}</EcommerceContext.Provider>
}

/** `true` si la tienda vende en línea; `false` en modo vitrina/catálogo. */
export function useEcommerceEnabled(): boolean {
  return useContext(EcommerceContext)
}
