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

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!hasInternalSecret(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await params
  const { data } = await platformDb()
    .from('tenants').select('primary_domain, domain_status, domain_requested').eq('id', id).maybeSingle()
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!hasInternalSecret(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await params
  const body = (await req.json().catch(() => ({}))) as { domain?: string }
  const res = await requestDomain(platformDb(), id, String(body.domain ?? ''))
  return NextResponse.json(res, { status: res.ok ? 200 : 400 })
}
