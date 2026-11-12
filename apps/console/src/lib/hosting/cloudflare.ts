/**
 * Proveedor de dominios sobre **Cloudflare for SaaS** (HU-431 · ADR-008 §5).
 * Cada dominio del comerciante es un *custom hostname* en la zona de Merkiai:
 * Cloudflare valida la propiedad, emite el certificado (TLS) y enruta al origen
 * compartido (fallback origin). El dominio queda DESACOPLADO del cómputo: mover
 * la app de Vercel a contenedores no re-registra dominios.
 *
 * API (verificada en developers.cloudflare.com, Cloudflare for SaaS):
 *   POST   /zones/{zone}/custom_hostnames            { hostname, ssl: { method: 'txt', type: 'dv' } }
 *   GET    /zones/{zone}/custom_hostnames?hostname=… → result[] con status, ssl.status,
 *          ownership_verification {type,name,value}, ssl.validation_records [{txt_name,txt_value}]
 *   DELETE /zones/{zone}/custom_hostnames/{id}
 * Listo para tráfico cuando `status` = active y `ssl.status` = active.
 *
 * Validación TXT (propiedad + certificado) → el certificado puede quedar listo
 * ANTES de que el comerciante cambie su DNS (sin corte). El comerciante apunta su
 * dominio con un CNAME al destino de Merkiai (`HOSTING_CNAME_TARGET`).
 *
 * El token NO viaja como env plano en producción: se lee del vault (HU-431 AC-4)
 * mediante `TokenSource`. Como el resto de proveedores, hacia afuera solo salen
 * estados/códigos abstractos; el detalle técnico va a `internalDetail` (logs).
 */
import type { DnsRecord, HostingProvider, ProvisionResult, ProvisionStatus } from './types'

type Fetch = typeof fetch
/** Devuelve el token de la API (vault o env). `null` = no configurado. */
export type TokenSource = () => Promise<string | null>

export interface CloudflareConfig {
  zoneId?: string
  /** Destino del CNAME del comerciante (p. ej. customers.merkiai.com). */
  cnameTarget?: string
}

interface CfHostname {
  id: string
  hostname: string
  status?: string
  ssl?: { status?: string; validation_records?: Array<{ txt_name?: string; txt_value?: string; status?: string }> }
  ownership_verification?: { type?: string; name?: string; value?: string }
}
interface CfEnvelope<T> { success?: boolean; errors?: Array<{ code?: number; message?: string }>; result?: T }

const API = 'https://api.cloudflare.com/client/v4'
/** Código de Cloudflare para "hostname duplicado" (alta idempotente). */
const DUPLICATE_CODES = new Set([1406, 1407])

function apexOf(domain: string): string {
  return domain.replace(/^www\./i, '').toLowerCase()
}

/** Registros de enrutado que el comerciante debe crear. PURO. */
export function cnameRecords(apex: string, target: string): DnsRecord[] {
  return [
    { type: 'CNAME', name: `www.${apex}`, value: target, purpose: 'Enrutado de www' },
    { type: 'CNAME', name: apex, value: target, purpose: 'Enrutado del dominio raíz (usa CNAME/ALIAS si tu proveedor DNS lo permite; si no, redirige el dominio raíz a www)' },
  ]
}

/** Traduce un custom hostname de Cloudflare al estado abstracto + registros pendientes. PURO. */
export function toProvisionStatus(h: CfHostname | null, apex: string, target: string): ProvisionStatus {
  const routing = cnameRecords(apex, target)
  if (!h) return { state: 'awaiting_dns', records: routing, active: false }
  if (['blocked', 'moved', 'deleted'].includes(h.status ?? '')) return { state: 'error', records: [], active: false }

  const records: DnsRecord[] = []
  if (h.status !== 'active' && h.ownership_verification?.name && h.ownership_verification.value) {
    records.push({ type: 'TXT', name: h.ownership_verification.name, value: h.ownership_verification.value, purpose: 'Verificación de propiedad del dominio' })
  }
  if (h.ssl?.status !== 'active') {
    for (const v of h.ssl?.validation_records ?? []) {
      if (v.txt_name && v.txt_value) records.push({ type: 'TXT', name: v.txt_name, value: v.txt_value, purpose: 'Validación del certificado HTTPS' })
    }
  }
  if (h.status === 'active' && h.ssl?.status === 'active') return { state: 'active', records: [], active: true }
  if (h.status === 'active') return { state: 'certificate', records: [...records, ...routing], active: false }
  return { state: 'awaiting_dns', records: [...records, ...routing], active: false }
}

export class CloudflareSaasHostingProvider implements HostingProvider {
  readonly id = 'managed'

  constructor(
    private readonly token: TokenSource,
    private readonly cfg: CloudflareConfig = {
      zoneId: process.env.HOSTING_ZONE_ID,
      cnameTarget: process.env.HOSTING_CNAME_TARGET,
    },
    private readonly doFetch: Fetch = fetch,
  ) {}

  private async ctx(): Promise<{ token: string; zone: string; target: string } | null> {
    const token = await this.token().catch(() => null)
    if (!token || !this.cfg.zoneId || !this.cfg.cnameTarget) return null
    return { token, zone: this.cfg.zoneId, target: this.cfg.cnameTarget }
  }

  private async call<T>(token: string, path: string, init: RequestInit = {}): Promise<{ status: number; body: CfEnvelope<T> }> {
    const res = await this.doFetch(`${API}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    })
    return { status: res.status, body: (await res.json().catch(() => ({}))) as CfEnvelope<T> }
  }

  private async find(token: string, zone: string, hostname: string): Promise<CfHostname | null> {
    const { body } = await this.call<CfHostname[]>(token, `/zones/${zone}/custom_hostnames?hostname=${encodeURIComponent(hostname)}`)
    return body.result?.find((h) => h.hostname?.toLowerCase() === hostname) ?? null
  }

  private async create(token: string, zone: string, hostname: string): Promise<ProvisionResult> {
    try {
      const { status, body } = await this.call<CfHostname>(token, `/zones/${zone}/custom_hostnames`, {
        method: 'POST',
        body: JSON.stringify({ hostname, ssl: { method: 'txt', type: 'dv' } }),
      })
      if (body.success) return { ok: true }
      const codes = (body.errors ?? []).map((e) => e.code ?? 0)
      const detail = (body.errors ?? []).map((e) => `${e.code}: ${e.message}`).join('; ') || `cloudflare ${status}`
      if (status === 409 || codes.some((c) => DUPLICATE_CODES.has(c))) {
        // Ya existe: ¿en NUESTRA zona? → idempotente. Si no aparece, otro lo tiene.
        return (await this.find(token, zone, hostname)) ? { ok: true } : { ok: false, code: 'conflict', internalDetail: detail }
      }
      if (status === 401 || status === 403) return { ok: false, code: 'not_configured', internalDetail: detail }
      return { ok: false, code: 'temporarily_unavailable', internalDetail: detail }
    } catch (e) {
      return { ok: false, code: 'temporarily_unavailable', internalDetail: e instanceof Error ? e.message : String(e) }
    }
  }

  async linkDomain(domain: string): Promise<ProvisionResult> {
    const c = await this.ctx()
    if (!c) return { ok: false, code: 'not_configured', internalDetail: 'token de Cloudflare / HOSTING_ZONE_ID / HOSTING_CNAME_TARGET ausentes' }
    const apex = apexOf(domain)
    const a = await this.create(c.token, c.zone, apex)
    if (!a.ok) return a
    const w = await this.create(c.token, c.zone, `www.${apex}`) // best-effort, como en el adaptador anterior
    return !w.ok && w.internalDetail ? { ok: true, internalDetail: `www no registrado: ${w.internalDetail}` } : { ok: true }
  }

  async unlinkDomain(domain: string): Promise<ProvisionResult> {
    const c = await this.ctx()
    if (!c) return { ok: true } // nada que desvincular
    const apex = apexOf(domain)
    try {
      for (const name of [apex, `www.${apex}`]) {
        const h = await this.find(c.token, c.zone, name)
        if (!h) continue
        const { status } = await this.call(c.token, `/zones/${c.zone}/custom_hostnames/${h.id}`, { method: 'DELETE' })
        if (status >= 400 && status !== 404 && name === apex) return { ok: false, code: 'temporarily_unavailable', internalDetail: `cloudflare ${status}` }
      }
      return { ok: true }
    } catch (e) {
      return { ok: false, code: 'temporarily_unavailable', internalDetail: e instanceof Error ? e.message : String(e) }
    }
  }

  async getStatus(domain: string): Promise<ProvisionStatus> {
    const apex = apexOf(domain)
    const c = await this.ctx()
    const target = this.cfg.cnameTarget ?? ''
    if (!c) return { state: 'awaiting_dns', records: cnameRecords(apex, target), active: false }
    try {
      return toProvisionStatus(await this.find(c.token, c.zone, apex), apex, c.target)
    } catch {
      return { state: 'awaiting_dns', records: cnameRecords(apex, c.target), active: false }
    }
  }
}
