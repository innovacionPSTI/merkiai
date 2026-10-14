/**
 * Control plane · multi-dominio de un tenant (HU-279).
 *   GET  → lista de dominios (con TXT de propiedad para los pendientes).
 *   POST → agrega un dominio (pending + token TXT) y lo da de alta en el hosting.
 * Auth: `x-internal-secret` (server-to-server; lo invoca el admin del comerciante).
 */
import { NextRequest, NextResponse } from 'next/server'
import { platformDb } from '@/lib/platform-db'
import { hasInternalSecret } from '@/lib/auth'
import { listDomains, addDomain } from '@/lib/custom-domains'
import { expectedTxtName, expectedTxtValue } from '@/lib/domain-verification'
import { getHostingProvider } from '@/lib/hosting'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!hasInternalSecret(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await params
  const domains = await listDomains(platformDb(), id).catch(() => [])
  return NextResponse.json({
    domains: domains.map((d) => ({
      id: d.id,
      domain: d.domain,
      status: d.status,
      isPrimary: d.isPrimary,
      // TXT de propiedad (público) para los pendientes.
      ...(d.status === 'pending' && d.verifyToken
        ? { txtName: expectedTxtName(d.domain), txtValue: expectedTxtValue(d.verifyToken) }
        : {}),
    })),
  })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!hasInternalSecret(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await params
  const body = (await req.json().catch(() => ({}))) as { domain?: string }
  const res = await addDomain(platformDb(), id, String(body.domain ?? ''))
  // Alta en la infraestructura de inmediato (idempotente).
  if (res.ok && res.domain) {
    const link = await getHostingProvider().linkDomain(res.domain)
    if (!link.ok && link.internalDetail) console.warn(`[hosting] link ${res.domain}: ${link.internalDetail}`)
  }
  return NextResponse.json(res, { status: res.ok ? 200 : 400 })
}
