/**
 * Proveedor de hosting DEDICADO / manual (HU-174 v3). Para planes cuyo sitio
 * vive en una VPS/host propio: no hay API de alta; el enrutado lo da el DNS
 * apuntando a la IP del host. El estado se deduce resolviendo el registro A.
 *
 * El alta/baja son no-op (el host ya sirve por Host header / vhost); la verdad
 * del aprovisionamiento es el DNS. El lookup se inyecta para poder testear.
 */
import type { HostingProvider, ProvisionResult, ProvisionStatus, DnsRecord } from './types'

export type ARecordResolver = (name: string) => Promise<string[]>

export class ManualHostingProvider implements HostingProvider {
  readonly id = 'dedicated'
  constructor(private hostIp: string, private resolveA: ARecordResolver) {}

  private routing(): DnsRecord[] {
    return [{ type: 'A', name: '@', value: this.hostIp, purpose: 'Enrutado del dominio a tu servidor' }]
  }

  async linkDomain(): Promise<ProvisionResult> { return { ok: true } }
  async unlinkDomain(): Promise<ProvisionResult> { return { ok: true } }

  async getStatus(domain: string): Promise<ProvisionStatus> {
    try {
      const ips = await this.resolveA(domain)
      if (ips.includes(this.hostIp)) return { state: 'active', records: [], active: true }
    } catch { /* sin resolución aún */ }
    return { state: 'awaiting_dns', records: this.routing(), active: false }
  }
}
