/**
 * Control plane · dominio propio de un tenant (HU-174).
 *   POST  → solicita el dominio (deja `pending` + token, devuelve instrucciones TXT).
 *   GET   → estado actual del dominio del tenant.
 * Auth: `x-internal-secret` (server-to-server; lo invoca el admin del comerciante).
 */
import { NextRequest, NextResponse } from 'next/server'
import { platformDb } from '@/lib/platform-db'
import { hasInternalSecret } from '@/lib/auth'
import { requestDomain, dnsTargetsFromEnv } from '@/lib/domain-service'
import { expectedDnsRecords, expectedTxtName, expectedTxtValue } from '@/lib/domain-verification'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!hasInternalSecret(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await params
  const { data } = await platformDb()
    .from('tenants').select('primary_domain, domain_status, domain_requested, domain_verify_token').eq('id', id).maybeSingle()
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  // Mientras haya un dominio en proceso, devolvemos también las instrucciones DNS
  // (TXT de propiedad + A/CNAME de apuntado) para que el admin las muestre.
  const domain = data.domain_requested as string | null
  const token = data.domain_verify_token as string | null
  const { domain_verify_token: _omit, ...publicData } = data as Record<string, unknown>
  return NextResponse.json({
    ...publicData,
    ...(domain && token
      ? {
          txtName: expectedTxtName(domain),
          txtValue: expectedTxtValue(token),
          dns: expectedDnsRecords(domain, dnsTargetsFromEnv()),
        }
      : {}),
  })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!hasInternalSecret(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await params
  const body = (await req.json().catch(() => ({}))) as { domain?: string }
  const res = await requestDomain(platformDb(), id, String(body.domain ?? ''), Math.random, dnsTargetsFromEnv())
  return NextResponse.json(res, { status: res.ok ? 200 : 400 })
}
