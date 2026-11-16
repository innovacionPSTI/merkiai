/**
 * Datos compartidos por las specs E2E: lo que siembra `lib/seed.ts` (genérico,
 * sin nicho) y helpers para construir contextos autenticados.
 */
import { request, type APIRequestContext } from '@playwright/test'
import { ADMIN_STORAGE } from '../playwright.config'

/** Producto sembrado por el preset E2E (precio base 12.000 COP). */
export const SEEDED_PRODUCT = { name: 'Producto E2E', slug: 'producto-e2e', price: 12000 }
/** Componente consumido al vender (receta `al_vender`, 18 g por unidad). */
export const SEEDED_COMPONENT_KEY = 'materia-prima-e2e'

export const ADMIN_URL = process.env.E2E_ADMIN_URL ?? 'http://localhost:3001'
export const WEB_URL = process.env.E2E_WEB_URL ?? 'http://tienda-test.localhost:3000'

/** Contexto HTTP del admin con la sesión de global-setup (para specs del storefront). */
export async function adminApi(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: ADMIN_URL, storageState: ADMIN_STORAGE })
}

/** Dirección de envío válida en Colombia (país por defecto). */
export const CO_ADDRESS = {
  address: 'Calle 1 # 2-3', city: 'Bogotá', department: 'Bogotá D.C.', country: 'CO', postal_code: '110111',
}
