import { redirect } from 'next/navigation'
import { getAdminUser } from './auth'
import { getAdminDb } from './admin-db'

/**
 * Para Server Components del admin (HU-158): devuelve el usuario admin y un
 * cliente de datos **acotado por RLS a su tenant** (`getAdminDb`). Redirige a
 * `/no-autorizado` si no hay acceso. Reemplaza a `createServerClient()`
 * (service-role, sin aislamiento) en las páginas.
 */
export async function requireAdminDb() {
  const adminUser = await getAdminUser()
  if (!adminUser) redirect('/no-autorizado')
  return { adminUser, db: getAdminDb(adminUser.tenantId) }
}
