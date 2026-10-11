/**
 * Resolución del proveedor de hosting por tenant (HU-174 v3). Internamente se
 * decide la infraestructura de cada sitio; el panel del comerciante no sabe
 * (ni debe saber) cuál es. Por defecto: plataforma gestionada. Si el tenant
 * tiene un host dedicado configurado, se usa el proveedor manual (DNS → IP).
 */
import type { HostingProvider } from './types'
import { VercelHostingProvider } from './vercel'
import { ManualHostingProvider } from './manual'
import { resolve4 } from 'node:dns/promises'

export * from './types'

/** Forma mínima del tenant necesaria para elegir proveedor. */
export interface TenantInfra {
  /** IP del host dedicado, si el plan/tenant corre en VPS propia. */
  dedicated_host_ip?: string | null
}

/** Devuelve el proveedor de hosting adecuado para el tenant. */
export function getHostingProvider(tenant?: TenantInfra | null): HostingProvider {
  if (tenant?.dedicated_host_ip) {
    return new ManualHostingProvider(tenant.dedicated_host_ip, (name) => resolve4(name))
  }
  return new VercelHostingProvider()
}

/** Mensaje genérico para el comerciante según el código abstracto (sin infra). */
export function provisionMessage(code?: string): string {
  switch (code) {
    case 'conflict':
      return 'Ese dominio ya está en uso en otra tienda. Verifica que sea tuyo o quítalo de donde esté.'
    case 'not_configured':
    case 'temporarily_unavailable':
    default:
      return 'No pudimos completar el enlace automático del dominio en este momento. Lo reintentaremos; mientras tanto tu tienda sigue disponible en tu subdominio.'
  }
}
