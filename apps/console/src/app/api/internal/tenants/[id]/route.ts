/**
 * Control plane · actualizar un tenant (HU-172): estado (suspender/reactivar),
 * plan, nivel de aislamiento, dominio propio, db_ref. Protegido por
 * `x-internal-secret` (interino; gate real = Stack Auth `platform:operate`).
 */
import { NextRequest, NextResponse } from 'next/server'
import { platformDb } from '@/lib/platform-db'
import { hasInternalSecret } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const STATUSES = ['trialing', 'active', 'past_due', 'suspended', 'canceled']
const ISOLATION = ['shared', 'schema', 'dedicated']

/** Devuelve el tenant + sus entitlements (features/limits del plan). HU-173. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!hasInternalSecret(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await params
  const db = platformDb()

  const { data: tenant } = await db
    .from('tenants')
    .select('id, name, subdomain, primary_domain, plan, data_isolation, db_ref, status')
    .eq('id', id)
    .maybeSingle()
  if (!tenant) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const { data: plan } = await db
    .from('plans')
    .select('features, limits')
    .eq('key', tenant.plan)
    .maybeSingle()

  return NextResponse.json({
    tenant,
    entitlements: { features: plan?.features ?? {}, limits: plan?.limits ?? {} },
  })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!hasInternalSecret(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await params

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'json inválido' }, { status: 400 })
  }

  const patch: Record<string, unknown> = {}
  if (body.status !== undefined) {
    if (!STATUSES.includes(String(body.status))) {
      return NextResponse.json({ error: `status inválido (${STATUSES.join('|')})` }, { status: 400 })
    }
    patch.status = body.status
  }
  if (body.plan !== undefined) patch.plan = String(body.plan)
  if (body.dataIsolation !== undefined) {
    if (!ISOLATION.includes(String(body.dataIsolation))) {
      return NextResponse.json({ error: `data_isolation inválido (${ISOLATION.join('|')})` }, { status: 400 })
    }
    patch.data_isolation = body.dataIsolation
  }
  if (body.dbRef !== undefined) patch.db_ref = body.dbRef === null ? null : String(body.dbRef)
  if (body.primaryDomain !== undefined) {
    if (body.primaryDomain === null) {
      patch.primary_domain = null
      patch.domain_status = 'none'
    } else {
      // HU-174: gating anti-hijack — solo se activa un dominio propio ya VERIFICADO.
      const domain = String(body.primaryDomain).trim().toLowerCase()
      const { data: t } = await platformDb()
        .from('tenants').select('domain_status, domain_requested').eq('id', id).maybeSingle()
      const verified = t?.domain_status === 'verified' || t?.domain_status === 'active'
      if (!verified || t?.domain_requested !== domain) {
        return NextResponse.json({ error: 'domain_not_verified', detail: 'El dominio debe verificarse (TXT) antes de activarse.' }, { status: 409 })
      }
      patch.primary_domain = domain
      patch.domain_status = 'active'
    }
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'nada que actualizar' }, { status: 400 })
  }

  const { data, error } = await platformDb()
    .from('tenants')
    .update(patch)
    .eq('id', id)
    .select('id, name, subdomain, primary_domain, plan, data_isolation, db_ref, status')
    .maybeSingle()

  if (error) {
    if ((error as { code?: string }).code === '23505') {
      return NextResponse.json({ error: 'valor duplicado (subdomain/dominio)' }, { status: 409 })
    }
    return NextResponse.json({ error: 'update_failed', detail: error.message }, { status: 502 })
  }
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json({ tenant: data })
}
