/**
 * Autorización del control plane vía la abstracción `IdentityProvider`
 * (no depende de Stack Auth directamente). Exige el permiso de plataforma
 * `platform:operate`.
 */
import { redirect } from 'next/navigation'
import { stackIdentity } from '@/lib/identity'

export const PLATFORM_PERMISSION = 'platform:operate'

/** Devuelve el operador autenticado con permiso; si no, redirige. */
export async function requirePlatformOperator() {
  const identity = stackIdentity()
  const user = await identity.getCurrentUser()
  if (!user) redirect('/login')
  if (!(await identity.hasPlatformPermission(PLATFORM_PERMISSION))) redirect('/no-autorizado')
  return user
}
