/**
 * Proveedor de hosting GESTIONADO sobre Vercel (HU-174 v3). Implementa la
 * interfaz `HostingProvider`. Todos los detalles (token, projectId, teamId,
 * mensajes de Vercel) quedan ENCAPSULADOS aquí: hacia afuera solo se exponen
 * estados y códigos abstractos; el detalle técnico va a `internalDetail` (logs).
 */
import type { HostingProvider, ProvisionResult, ProvisionStatus, DnsRecord } from './types'

type Fetch = typeof fetch

function cfg() {
  // Nombres GENÉRICOS (no delatan el proveedor) y sin el prefijo `VERCEL_`,
  // que Vercel reserva para sus variables de sistema y no deja crear como env propias.
  return {
    token: process.env.HOSTING_API_TOKEN,
    projectId: process.env.HOSTING_PROJECT_ID,
    teamId: process.env.HOSTING_TEAM_ID,
    aRecord: process.env.HOSTING_A_RECORD || '76.76.21.21',
    cname: process.env.HOSTING_CNAME_TARGET || 'cname.vercel-dns.com',
  }
}
const qs = (teamId?: string) => (teamId ? `?teamId=${encodeURIComponent(teamId)}` : '')

function routingRecords(domain: string, aRecord: string, cname: string): DnsRecord[] {
  return [
    { type: 'A', name: '@', value: aRecord, purpose: 'Enrutado del dominio raíz' },
    { type: 'CNAME', name: 'www', value: cname, purpose: 'Enrutado de www (recomendado)' },
  ]
}

export class VercelHostingProvider implements HostingProvider {
  readonly id = 'managed'
  constructor(private doFetch: Fetch = fetch) {}

  async linkDomain(domain: string): Promise<ProvisionResult> {
    const { token, projectId, teamId } = cfg()
    if (!token || !projectId) return { ok: false, code: 'not_configured', internalDetail: 'HOSTING_API_TOKEN/HOSTING_PROJECT_ID ausentes' }
    try {
      const res = await this.doFetch(
        `https://api.vercel.com/v10/projects/${encodeURIComponent(projectId)}/domains${qs(teamId)}`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: domain }) },
      )
      const data = await res.json().catch(() => ({})) as { error?: { code?: string; message?: string } }
      if (res.ok) return { ok: true }
      const code = data.error?.code
      if (res.status === 409 || code === 'domain_already_in_use' || code === 'domain_already_exists') return { ok: true }
      if (code === 'not_found' || /project.*not.*found/i.test(data.error?.message ?? '')) {
        return { ok: false, code: 'not_configured', internalDetail: data.error?.message ?? `vercel ${res.status}` }
      }
      return { ok: false, code: 'temporarily_unavailable', internalDetail: data.error?.message ?? `vercel ${res.status}` }
    } catch (e) {
      return { ok: false, code: 'temporarily_unavailable', internalDetail: e instanceof Error ? e.message : String(e) }
    }
  }

  async unlinkDomain(domain: string): Promise<ProvisionResult> {
    const { token, projectId, teamId } = cfg()
    if (!token || !projectId) return { ok: true } // nada que desvincular
    try {
      const res = await this.doFetch(
        `https://api.vercel.com/v9/projects/${encodeURIComponent(projectId)}/domains/${encodeURIComponent(domain)}${qs(teamId)}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } },
      )
      if (res.ok || res.status === 404) return { ok: true }
      return { ok: false, code: 'temporarily_unavailable', internalDetail: `vercel ${res.status}` }
    } catch (e) {
      return { ok: false, code: 'temporarily_unavailable', internalDetail: e instanceof Error ? e.message : String(e) }
    }
  }

  async getStatus(domain: string): Promise<ProvisionStatus> {
    const { token, projectId, teamId, aRecord, cname } = cfg()
    const routing = routingRecords(domain, aRecord, cname)
    if (!token || !projectId) return { state: 'awaiting_dns', records: routing, active: false }

    try {
      const res = await this.doFetch(
        `https://api.vercel.com/v9/projects/${encodeURIComponent(projectId)}/domains/${encodeURIComponent(domain)}${qs(teamId)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      if (res.status === 404) return { state: 'awaiting_dns', records: routing, active: false }
      const d = await res.json().catch(() => ({})) as { verified?: boolean; verification?: Array<{ type: string; domain: string; value: string }> }

      if (!d.verified) {
        const vrecords: DnsRecord[] = (d.verification ?? []).map((v) => ({
          type: (v.type?.toUpperCase() as DnsRecord['type']) || 'TXT',
          name: v.domain,
          value: v.value,
          purpose: 'Validación de certificado',
        }))
        return { state: 'awaiting_dns', records: vrecords.length ? vrecords : routing, active: false }
      }

      // Verificado: ¿ya está bien configurado (DNS apuntando) o aún propagando?
      const cfgRes = await this.doFetch(
        `https://api.vercel.com/v6/domains/${encodeURIComponent(domain)}/config${qs(teamId)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      const conf = await cfgRes.json().catch(() => ({})) as { misconfigured?: boolean }
      if (conf.misconfigured) return { state: 'propagating', records: routing, active: false }
      return { state: 'active', records: [], active: true }
    } catch {
      return { state: 'awaiting_dns', records: routing, active: false }
    }
  }
}
