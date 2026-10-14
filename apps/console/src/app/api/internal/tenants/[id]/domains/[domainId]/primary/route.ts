/**
 * Control plane · marca un dominio como PRIMARIO (canónico) y activo (HU-279).
 * Desmarca el primario anterior (sigue activo como alias), da de alta en hosting
 * y sincroniza la columna legacy `tenants.primary_domain`. POST. Auth: `x-internal-secret`.
 */
import { NextRequest, NextResponse } from 'next/server'
import { platformDb } from '@/lib/platform-db'
import { hasInternalSecret } from '@/lib/auth'
import { setPrimaryDomain, getDomainById } from '@/lib/custom-domains'
import { getHostingProvider } from '@/lib/hosting'
import { syncPrimaryDomainColumn } from '../../_sync'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; domainId: string }> }) {
  if (!hasInternalSecret(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id, domainId } = await params
  const db = platformDb()
  const res = await setPrimaryDomain(db, id, domainId)
  if (!res.ok) return NextResponse.json(res, { status: 409 })
  const d = await getDomainById(db, id, domainId)
  if (d?.domain) {
    const link = await getHostingProvider().linkDomain(d.domain)
    if (!link.ok && link.internalDetail) console.warn(`[hosting] link ${d.domain}: ${link.internalDetail}`)
    await syncPrimaryDomainColumn(db, id, d.domain)
  }
  return NextResponse.json({ ok: true })
}
