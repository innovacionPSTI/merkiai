/**
 * Identity del proyecto ADMIN de Stack Auth (donde viven los operadores de
 * tienda / Teams = tenants). La consola la usa SOLO para aprovisionar Teams al
 * crear un tenant (HU-209). Devuelve `null` si no está configurado (provisioning
 * parcial: se crea el tenant + subdominio, el Team se adjunta luego).
 *
 * Requiere en el entorno de la consola:
 *   NEXT_PUBLIC_ADMIN_HEXCLAVE_PROJECT_ID
 *   NEXT_PUBLIC_ADMIN_HEXCLAVE_PUBLISHABLE_CLIENT_KEY
 *   ADMIN_HEXCLAVE_SECRET_SERVER_KEY
 */
import { StackServerApp } from '@stackframe/stack'
import type { IdentityProvider } from '@merkiai/tenancy'
import { stackIdentity } from './identity'

export function adminIdentity(): IdentityProvider | null {
  const projectId = process.env.NEXT_PUBLIC_ADMIN_HEXCLAVE_PROJECT_ID
  const publishableClientKey = process.env.NEXT_PUBLIC_ADMIN_HEXCLAVE_PUBLISHABLE_CLIENT_KEY
  const secretServerKey = process.env.ADMIN_HEXCLAVE_SECRET_SERVER_KEY
  if (!projectId || !publishableClientKey || !secretServerKey) return null

  const app = new StackServerApp({ tokenStore: 'memory', projectId, publishableClientKey, secretServerKey })
  return stackIdentity(app)
}
