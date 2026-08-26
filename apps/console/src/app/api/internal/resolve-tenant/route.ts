/**
 * API interna del control plane: resolución host → tenant (E17 · HU-157).
 *
 * Lee el registro `tenants` de la BD de PLATAFORMA (service-role) y devuelve el
 * tenant asociado a un host (dominio propio o subdominio). La consume el plano
 * de tienda (`apps/web`) para desenganchar `getTenantDb` del tenant por defecto,
 * sin darle a web acceso directo a la BD de plataforma.
 *
 * Seguridad: endpoint SOLO interno. Requiere el header `x-internal-secret` =
 * `INTERNAL_API_SECRET`. No exponer públicamente.
 */
import { NextRequest, NextResponse } from 'next/server'
import { platformDb } from '@/lib/platform-db'
import { hasInternalSecret } from '@/lib/auth'
import { normalizeHost, isValidHost } from '@/lib/validation'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!hasInternalSecret(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const host = normalizeHost(req.nextUrl.searchParams.get('host') ?? '')
  if (!host) return NextResponse.json({ error: 'host requerido' }, { status: 400 })
  // Seguridad: charset estricto de hostname → evita inyección en el filtro PostgREST.
  if (!isValidHost(host)) {
    return NextResponse.json({ error: 'host inválido' }, { status: 400 })
  }
  const subdomain = host.split('.')[0]

  const db = platformDb()
  const { data, error } = await db
    .from('tenants')
    .select('id, subdomain, primary_domain, db_ref, plan, status')
    .or(`primary_domain.eq.${host},subdomain.eq.${subdomain}`)
    .limit(1)
    .maybeSingle()

  if (error) return NextResponse.json({ error: 'lookup_failed' }, { status: 502 })
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  // Entitlements del plan (HU-173): features/limits para gating en el plano de tienda.
  const { data: plan } = await db
    .from('plans')
    .select('features, limits')
    .eq('key', data.plan)
    .maybeSingle()

  return NextResponse.json({
    tenantId: data.id,
    subdomain: data.subdomain,
    primaryDomain: data.primary_domain,
    dbRef: data.db_ref,
    plan: data.plan,
    status: data.status,
    entitlements: { features: plan?.features ?? {}, limits: plan?.limits ?? {} },
  })
}
