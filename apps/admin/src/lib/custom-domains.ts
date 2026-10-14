/**
 * Multi-dominio (HU-279) — puente admin → control plane. La lista de dominios
 * vive en la BD de plataforma (`tenant_custom_domains`); el admin la consulta y
 * la opera vía los endpoints internos de la consola (server-to-server).
 */
import type { DnsRecord, ProvisionState } from './domains'

export type CustomDomainStatus = 'pending' | 'verified' | 'active'

export interface AdminCustomDomain {
  id: string
  domain: string
  status: CustomDomainStatus
  isPrimary: boolean
  txtName?: string
  txtValue?: string
}

export interface DomainProvision {
  id: string
  domain: string
  status: CustomDomainStatus
  isPrimary: boolean
  txtName?: string
  txtValue?: string
  provision?: { state: ProvisionState; records: DnsRecord[]; active: boolean }
}

function base(): string | null {
  const b = process.env.CONTROL_PLANE_URL
  return b ? b.replace(/\/$/, '') : null
}
function headers(): Record<string, string> | null {
  const secret = process.env.INTERNAL_API_SECRET
  return secret ? { 'Content-Type': 'application/json', 'x-internal-secret': secret } : null
}

async function call<T>(path: string, init?: RequestInit): Promise<T | null> {
  const b = base(); const h = headers()
  if (!b || !h) return null
  try {
    const res = await fetch(`${b}${path}`, { headers: h, cache: 'no-store', ...init })
    if (!res.ok) return (await res.json().catch(() => null)) as T | null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export async function listCustomDomains(tenantId: string): Promise<AdminCustomDomain[]> {
  const d = await call<{ domains: AdminCustomDomain[] }>(`/api/internal/tenants/${tenantId}/domains`)
  return d?.domains ?? []
}

export async function getDomainProvision(tenantId: string, domainId: string): Promise<DomainProvision | null> {
  return call<DomainProvision>(`/api/internal/tenants/${tenantId}/domains/${domainId}`)
}

type Res = { ok?: boolean; error?: string; id?: string; domain?: string; txtName?: string; txtValue?: string }

export async function addCustomDomain(tenantId: string, domain: string): Promise<Res> {
  return (await call<Res>(`/api/internal/tenants/${tenantId}/domains`, { method: 'POST', body: JSON.stringify({ domain }) })) ?? { ok: false, error: 'Control plane no configurado.' }
}
export async function verifyCustomDomain(tenantId: string, domainId: string): Promise<Res> {
  return (await call<Res>(`/api/internal/tenants/${tenantId}/domains/${domainId}/verify`, { method: 'POST' })) ?? { ok: false, error: 'Control plane no configurado.' }
}
export async function activateCustomDomain(tenantId: string, domainId: string): Promise<Res> {
  return (await call<Res>(`/api/internal/tenants/${tenantId}/domains/${domainId}/activate`, { method: 'POST' })) ?? { ok: false, error: 'Control plane no configurado.' }
}
export async function setPrimaryCustomDomain(tenantId: string, domainId: string): Promise<Res> {
  return (await call<Res>(`/api/internal/tenants/${tenantId}/domains/${domainId}/primary`, { method: 'POST' })) ?? { ok: false, error: 'Control plane no configurado.' }
}
export async function removeCustomDomain(tenantId: string, domainId: string): Promise<Res> {
  return (await call<Res>(`/api/internal/tenants/${tenantId}/domains/${domainId}`, { method: 'DELETE' })) ?? { ok: false, error: 'Control plane no configurado.' }
}
