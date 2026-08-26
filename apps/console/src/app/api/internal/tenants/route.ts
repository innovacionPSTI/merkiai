/**
 * Control plane · gestión de tenants (HU-172). Reemplaza el provisioning por SQL.
 * Protegido por `x-internal-secret` (interino; el gate real es Stack Auth
 * `platform:operate`). Opera sobre la BD de plataforma.
 */
import { NextRequest, NextResponse } from 'next/server'
import { platformDb } from '@/lib/platform-db'
import { hasInternalSecret } from '@/lib/auth'
import { isValidSubdomain } from '@/lib/validation'

export const dynamic = 'force-dynamic'

/** Lista todos los tenants. */
export async function GET(req: NextRequest) {
  if (!hasInternalSecret(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data, error } = await platformDb()
    .from('tenants')
    .select('id, name, subdomain, primary_domain, plan, data_isolation, db_ref, status, created_at')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: 'list_failed', detail: error.message }, { status: 502 })
  return NextResponse.json({ tenants: data ?? [] })
}

/** Provisiona un tenant nuevo. */
export async function POST(req: NextRequest) {
  if (!hasInternalSecret(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'json inválido' }, { status: 400 })
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const subdomain = typeof body.subdomain === 'string' ? body.subdomain.trim().toLowerCase() : ''
  if (!name || !subdomain) {
    return NextResponse.json({ error: 'name y subdomain requeridos' }, { status: 400 })
  }
  if (!isValidSubdomain(subdomain)) {
    return NextResponse.json({ error: 'subdomain inválido (a-z, 0-9, -; 2-40)' }, { status: 400 })
  }
  const plan = typeof body.plan === 'string' ? body.plan : 'free'
  const stackTeamId = typeof body.stackTeamId === 'string' ? body.stackTeamId : null

  const { data, error } = await platformDb()
    .from('tenants')
    .insert({
      name,
      subdomain,
      plan,
      stack_team_id: stackTeamId,
      status: 'active',
      data_isolation: 'shared',
      db_ref: null,
    })
    .select('id, name, subdomain, plan, status, data_isolation, db_ref, created_at')
    .single()

  if (error) {
    if ((error as { code?: string }).code === '23505') {
      return NextResponse.json({ error: 'subdomain ya existe' }, { status: 409 })
    }
    return NextResponse.json({ error: 'create_failed', detail: error.message }, { status: 502 })
  }
  return NextResponse.json({ tenant: data }, { status: 201 })
}
