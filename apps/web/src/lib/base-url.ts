/**
 * URL base del storefront por tenant (E17 · HU-157).
 *
 * En multi-tenant la URL ya no es una constante de entorno: cada tenant vive en
 * su subdominio por defecto o en su dominio propio. Estos helpers derivan la base
 * correcta para construir URLs externas (webhook/return de pagos, canónicas SEO,
 * links de email, previews).
 *
 * Orden de precedencia (seguro):
 *   1. Dominio canónico del tenant (`tenants.primary_domain` || `subdomain`) —
 *      lo pasará HU-157/174 cuando la resolución por host esté cableada.
 *   2. Host de la petición (multi-tenant por subdominio) — este incremento.
 *   3. `NEXT_PUBLIC_SITE_URL` — fallback single-tenant/dev.
 */

function stripTrailingSlash(u: string): string {
  return u.replace(/\/$/, '')
}

/** Deriva `${proto}://${host}` desde los headers de la petición. */
export function baseUrlFromRequest(req: { headers: Headers }): string {
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  if (host) {
    const isLocal = host.startsWith('localhost') || host.startsWith('127.')
    const proto = req.headers.get('x-forwarded-proto') ?? (isLocal ? 'http' : 'https')
    return stripTrailingSlash(`${proto}://${host}`)
  }
  return stripTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL ?? '')
}

/**
 * URL canónica de un tenant a partir de su registro. Fuente de verdad para
 * URLs estables (webhook, SEO, email). Cuando exista `primary_domain` (dominio
 * propio verificado, HU-174) se usa; si no, el subdominio por defecto.
 */
export function tenantBaseUrl(
  tenant: { primaryDomain?: string | null; subdomain?: string | null } | null | undefined,
  rootDomain: string = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'merkiai.com',
): string | null {
  if (tenant?.primaryDomain) return stripTrailingSlash(`https://${tenant.primaryDomain}`)
  if (tenant?.subdomain) return stripTrailingSlash(`https://${tenant.subdomain}.${rootDomain}`)
  return null
}

/**
 * Base URL preferida: dominio canónico del tenant si se conoce; si no, el host
 * de la petición; y por último el env de fallback.
 */
export function resolveBaseUrl(
  req: { headers: Headers },
  tenant?: { primaryDomain?: string | null; subdomain?: string | null } | null,
): string {
  return tenantBaseUrl(tenant) ?? baseUrlFromRequest(req)
}
