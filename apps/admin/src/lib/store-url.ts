/**
 * Resuelve la URL pública de la TIENDA de un tenant (donde viven los webhooks y
 * el checkout), vía control plane. Prefiere el dominio propio activo; si no, el
 * subdominio *.merkiai.com. Ambos resuelven al tenant (resolve-tenant hace OR de
 * primary_domain/subdomain), así que la URL de webhook registrada funciona en
 * cualquiera de los dos.
 */
const BASE_DOMAIN = process.env.STOREFRONT_BASE_DOMAIN ?? 'merkiai.com'

export async function resolveStoreBaseUrl(tenantId: string): Promise<string | null> {
  const base = process.env.CONTROL_PLANE_URL
  const secret = process.env.INTERNAL_API_SECRET
  if (!base || !secret) return null
  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/api/internal/tenants/${tenantId}`, {
      headers: { 'x-internal-secret': secret }, cache: 'no-store',
    })
    if (!res.ok) return null
    const d = await res.json()
    const t = d?.tenant
    if (!t) return null
    const host = (t.primary_domain as string | null) || (t.subdomain ? `${t.subdomain}.${BASE_DOMAIN}` : null)
    if (!host) return null
    const proto = host.includes('localhost') ? 'http' : 'https'
    return `${proto}://${host}`
  } catch {
    return null
  }
}
