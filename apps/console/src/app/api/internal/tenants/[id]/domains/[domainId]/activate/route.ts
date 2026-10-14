/**
 * Control plane · activa un dominio verificado (alias que resuelve al tenant,
 * sin ser el primario) (HU-279). POST. Auth: `x-internal-secret`.
 */
import { NextRequest, NextResponse } from 'next/server'
import { platformDb } from '@/lib/platform-db'
import { hasInternalSecret } from '@/lib/auth'
import { activateDomain, getDomainById } from '@/lib/custom-domains'
import { getHostingProvider } from '@/lib/hosting'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; domainId: string }> }) {
  if (!hasInternalSecret(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id, domainId } = await params
  const db = platformDb()
  const res = await activateDomain(db, id, domainId)
  if (!res.ok) return NextResponse.json(res, { status: 409 })
  const d = await getDomainById(db, id, domainId)
  if (d?.domain) {
    const link = await getHostingProvider().linkDomain(d.domain)
    if (!link.ok && link.internalDetail) console.warn(`[hosting] link ${d.domain}: ${link.internalDetail}`)
  }
  return NextResponse.json({ ok: true })
}
