/**
 * Vista previa (HU-128) — lado admin. Arma el enlace de preview de la tienda:
 * resuelve el host del tenant (dominio propio o subdominio) vía control plane y
 * firma el **token por-tenant** con `PREVIEW_SIGNING_SECRET` (mismo secreto que
 * verifica la web). El enlace abre `/api/preview` en el host de la tienda.
 */
import { makePreviewToken } from '@merkiai/database'

const BASE_DOMAIN = process.env.STOREFRONT_BASE_DOMAIN ?? 'merkiai.com'

async function fetchTenantHost(tenantId: string): Promise<string | null> {
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
    // Dominio propio (solo se setea cuando está activo, HU-174) o el subdominio.
    if (t.primary_domain) return t.primary_domain as string
    if (t.subdomain) return `${t.subdomain}.${BASE_DOMAIN}`
    return null
  } catch {
    return null
  }
}

/** URL de vista previa de la tienda para `path` (o null si no se pudo resolver). */
export async function getPreviewUrl(tenantId: string, path = '/'): Promise<string | null> {
  const secret = process.env.PREVIEW_SIGNING_SECRET
  if (!secret) return null
  const host = await fetchTenantHost(tenantId)
  if (!host) return null
  const token = makePreviewToken(tenantId, secret)
  const proto = host.includes('localhost') ? 'http' : 'https'
  const qs = new URLSearchParams({ token, path }).toString()
  return `${proto}://${host}/api/preview?${qs}`
}
