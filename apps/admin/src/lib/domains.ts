/**
 * Dominio propio (HU-174) — puente admin → control plane. El estado del dominio
 * vive en la BD de plataforma (registro de tenants); el admin lo consulta y lo
 * opera vía los endpoints internos de la consola (server-to-server).
 */
export type DomainStatus = 'none' | 'pending' | 'verified' | 'active'

export interface DnsRecord {
  type: 'TXT' | 'A' | 'CNAME'
  name: string
  value: string
  note?: string
}

export interface DomainState {
  primary_domain: string | null
  domain_status: DomainStatus
  domain_requested: string | null
  /** Instrucciones vigentes (presentes mientras hay un dominio en proceso). */
  txtName?: string
  txtValue?: string
  dns?: DnsRecord[]
}

export interface DomainInstructions {
  ok: boolean
  error?: string
  domain?: string
  txtName?: string
  txtValue?: string
  dns?: DnsRecord[]
}

function base(): string | null {
  const b = process.env.CONTROL_PLANE_URL
  return b ? b.replace(/\/$/, '') : null
}
function headers(): Record<string, string> | null {
  const secret = process.env.INTERNAL_API_SECRET
  return secret ? { 'Content-Type': 'application/json', 'x-internal-secret': secret } : null
}

export async function getDomainState(tenantId: string): Promise<DomainState | null> {
  const b = base(); const h = headers()
  if (!b || !h) return null
  try {
    const res = await fetch(`${b}/api/internal/tenants/${tenantId}/domain`, { headers: h, cache: 'no-store' })
    if (!res.ok) return null
    return (await res.json()) as DomainState
  } catch {
    return null
  }
}

export async function requestDomain(tenantId: string, domain: string): Promise<DomainInstructions> {
  const b = base(); const h = headers()
  if (!b || !h) return { ok: false, error: 'Control plane no configurado.' }
  try {
    const res = await fetch(`${b}/api/internal/tenants/${tenantId}/domain`, {
      method: 'POST', headers: h, cache: 'no-store', body: JSON.stringify({ domain }),
    })
    return (await res.json()) as DomainInstructions
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function verifyDomain(tenantId: string): Promise<{ ok: boolean; status?: string; error?: string }> {
  const b = base(); const h = headers()
  if (!b || !h) return { ok: false, error: 'Control plane no configurado.' }
  try {
    const res = await fetch(`${b}/api/internal/tenants/${tenantId}/domain/verify`, { method: 'POST', headers: h, cache: 'no-store' })
    return await res.json()
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

export interface PatchResult {
  ok: boolean
  error?: string
  /** Resultado del aprovisionamiento en Vercel (alta/baja del dominio). */
  vercel?: { ok: boolean; skipped?: boolean; error?: string; verified?: boolean }
}

/** Activa el dominio verificado (PATCH primaryDomain; el control plane lo gatea por estado). */
export async function activateDomain(tenantId: string, domain: string): Promise<PatchResult> {
  return patchPrimaryDomain(tenantId, domain)
}

/** Quita el dominio propio: vuelve al subdominio *.merkiai.com (primary_domain=null). */
export async function removeDomain(tenantId: string): Promise<PatchResult> {
  return patchPrimaryDomain(tenantId, null)
}

async function patchPrimaryDomain(tenantId: string, primaryDomain: string | null): Promise<PatchResult> {
  const b = base(); const h = headers()
  if (!b || !h) return { ok: false, error: 'Control plane no configurado.' }
  try {
    const res = await fetch(`${b}/api/internal/tenants/${tenantId}`, {
      method: 'PATCH', headers: h, cache: 'no-store', body: JSON.stringify({ primaryDomain }),
    })
    const d = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { ok: false, error: d.detail ?? d.error ?? `Error ${res.status}` }
    }
    return { ok: true, vercel: d.vercel }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
