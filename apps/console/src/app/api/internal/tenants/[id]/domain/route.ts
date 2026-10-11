/**
 * Control plane · dominio propio de un tenant (HU-174).
 *   POST  → solicita el dominio (deja `pending` + token, devuelve instrucciones TXT).
 *   GET   → estado actual del dominio del tenant.
 * Auth: `x-internal-secret` (server-to-server; lo invoca el admin del comerciante).
 */
import { NextRequest, NextResponse } from 'next/server'
import { platformDb } from '@/lib/platform-db'
import { hasInternalSecret } from '@/lib/auth'
import { requestDomain } from '@/lib/domain-service'
import { expectedTxtName, expectedTxtValue } from '@/lib/domain-verification'
import { getHostingProvider } from '@/lib/hosting'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!hasInternalSecret(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await params
  const { data } = await platformDb()
    .from('tenants').select('primary_domain, domain_status, domain_requested, domain_verify_token').eq('id', id).maybeSingle()
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const domain = data.domain_requested as string | null
  const token = data.domain_verify_token as string | null
  const { domain_verify_token: _omit, ...publicData } = data as Record<string, unknown>

  if (!domain || !token) return NextResponse.json(publicData)

  // Registros DNS + estado del aprovisionamiento desde la abstracción de hosting
  // (no se expone qué infraestructura es). Incluye el TXT de propiedad.
  const provider = getHostingProvider()
  const provision = await provider.getStatus(domain)
  return NextResponse.json({
    ...publicData,
    txtName: expectedTxtName(domain),
    txtValue: expectedTxtValue(token),
    provision, // { state, records, active }
  })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!hasInternalSecret(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await params
  const body = (await req.json().catch(() => ({}))) as { domain?: string }
  const res = await requestDomain(platformDb(), id, String(body.domain ?? ''))
  // Da de alta el dominio en la infraestructura de inmediato (idempotente).
  if (res.ok && res.domain) {
    const link = await getHostingProvider().linkDomain(res.domain)
    if (!link.ok && link.internalDetail) console.warn(`[hosting] link ${res.domain}: ${link.internalDetail}`)
  }
  return NextResponse.json(res, { status: res.ok ? 200 : 400 })
}
