'use client'

/**
 * Capacidades del plan visibles en componentes compartidos del panel (HU-359).
 * El layout las resuelve una vez (entitlements del tenant) y los componentes
 * reutilizables —p. ej. `ImageUpload`— las leen sin pedirlas de nuevo.
 * Por defecto todo permitido (fail-open, igual que sin control-plane).
 */
import { createContext, useContext } from 'react'

export interface AdminFeatures {
  /** HU-357 · elegir imágenes ya subidas desde la biblioteca de medios. */
  mediaLibrary: boolean
}

const AdminFeaturesContext = createContext<AdminFeatures>({ mediaLibrary: true })

export function AdminFeaturesProvider({ value, children }: { value: AdminFeatures; children: React.ReactNode }) {
  return <AdminFeaturesContext.Provider value={value}>{children}</AdminFeaturesContext.Provider>
}

export function useAdminFeatures(): AdminFeatures {
  return useContext(AdminFeaturesContext)
}
