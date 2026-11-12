/**
 * Resolución del proveedor de hosting por tenant (HU-174 v3). Internamente se
 * decide la infraestructura de cada sitio; el panel del comerciante no sabe
 * (ni debe saber) cuál es. Por defecto: plataforma gestionada. Si el tenant
 * tiene un host dedicado configurado, se usa el proveedor manual (DNS → IP).
 */
import type { HostingProvider } from './types'
import { VercelHostingProvider } from './vercel'
import { CloudflareSaasHostingProvider, type TokenSource } from './cloudflare'
import { ManualHostingProvider } from './manual'
import { resolve4 } from 'node:dns/promises'

export * from './types'

/** Forma mínima del tenant necesaria para elegir proveedor. */
export interface TenantInfra {
  /** IP del host dedicado, si el plan/tenant corre en VPS propia. */
  dedicated_host_ip?: string | null
}

/**
 * Token de Cloudflare (HU-431 AC-4): primero el vault (ref guardada desde la
 * consola en `platform_settings`); `HOSTING_API_TOKEN` en env solo como respaldo
 * transitorio. Import perezoso: este módulo no arrastra el vault si no se usa.
 */
export const cloudflareTokenFromVault: TokenSource = async () => {
  try {
    const [{ platformDb }, { getSetting, HOSTING_TOKEN_REF_KEY }, { getSecretsVault }] = await Promise.all([
      import('../platform-db'), import('../platform-settings'), import('../vault'),
    ])
    const ref = await getSetting(platformDb(), HOSTING_TOKEN_REF_KEY)
    if (ref) return await getSecretsVault().get(ref)
  } catch (e) {
    console.error('[hosting] no se pudo leer el token de Cloudflare del vault', e instanceof Error ? e.message : e)
  }
  return process.env.HOSTING_API_TOKEN || null
}

/** Proveedor gestionado según `HOSTING_PROVIDER` (`cloudflare` | `vercel`, default vercel). */
export function managedProviderId(): 'cloudflare' | 'vercel' {
  return process.env.HOSTING_PROVIDER === 'cloudflare' ? 'cloudflare' : 'vercel'
}

/** Devuelve el proveedor de hosting adecuado para el tenant. */
export function getHostingProvider(tenant?: TenantInfra | null): HostingProvider {
  if (tenant?.dedicated_host_ip) {
    return new ManualHostingProvider(tenant.dedicated_host_ip, (name) => resolve4(name))
  }
  return managedProviderId() === 'cloudflare'
    ? new CloudflareSaasHostingProvider(cloudflareTokenFromVault)
    : new VercelHostingProvider()
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
