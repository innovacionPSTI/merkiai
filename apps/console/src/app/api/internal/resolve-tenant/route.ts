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
  // `www.` es un alias del apex: www.merkiai.com debe resolver al tenant cuyo
  // primary_domain es merkiai.com (y viceversa). El subdominio de plataforma se
  // toma de la primera etiqueta, salvo que sea 'www' (que no es un subdominio).
  const bareHost = host.replace(/^www\./, '')
  const firstLabel = host.split('.')[0]

  const db = platformDb()

  // 1) HU-279: dominio propio ACTIVO en tenant_custom_domains (multi-dominio).
  //    Cualquier dominio 'active' resuelve al tenant; se guardan sin 'www.'.
  //    Defensivo: si la tabla no existe aún (pre-migración), se ignora y se usa
  //    el fallback por columnas de `tenants`.
  let tenantId: string | null = null
  try {
    const { data: cd } = await db
      .from('tenant_custom_domains')
      .select('tenant_id')
      .eq('status', 'active')
      .in('domain', [host, bareHost])
      .limit(1)
      .maybeSingle()
    tenantId = (cd?.tenant_id as string | undefined) ?? null
  } catch { /* tabla ausente → fallback */ }

  // 2) Fallback/legacy: columnas de `tenants` (primary_domain / subdomain).
  let tenant: { id: string; subdomain: string | null; primary_domain: string | null; db_ref: string | null; plan: string; status: string } | null = null
  if (tenantId) {
    const { data } = await db
      .from('tenants')
      .select('id, subdomain, primary_domain, db_ref, plan, status')
      .eq('id', tenantId)
      .maybeSingle()
    tenant = data ?? null
  } else {
    const orParts = [`primary_domain.eq.${host}`, `primary_domain.eq.${bareHost}`]
    if (firstLabel && firstLabel !== 'www') orParts.push(`subdomain.eq.${firstLabel}`)
    const { data, error } = await db
      .from('tenants')
      .select('id, subdomain, primary_domain, db_ref, plan, status')
      .or(orParts.join(','))
      .limit(1)
      .maybeSingle()
    if (error) return NextResponse.json({ error: 'lookup_failed' }, { status: 502 })
    tenant = data ?? null
  }

  if (!tenant) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  // Dominio canónico: el PRIMARIO activo de la tabla si existe; si no, la columna.
  let primaryDomain = tenant.primary_domain
  try {
    const { data: primary } = await db
      .from('tenant_custom_domains')
      .select('domain')
      .eq('tenant_id', tenant.id)
      .eq('is_primary', true)
      .eq('status', 'active')
      .maybeSingle()
    if (primary?.domain) primaryDomain = primary.domain as string
  } catch { /* tabla ausente → columna */ }

  // Entitlements del plan (HU-173): features/limits para gating en el plano de tienda.
  const { data: plan } = await db
    .from('plans')
    .select('features, limits, role_access')
    .eq('key', tenant.plan)
    .maybeSingle()

  return NextResponse.json({
    tenantId: tenant.id,
    subdomain: tenant.subdomain,
    primaryDomain,
    dbRef: tenant.db_ref,
    plan: tenant.plan,
    status: tenant.status,
    entitlements: { features: plan?.features ?? {}, limits: plan?.limits ?? {}, roleAccess: plan?.role_access ?? {} },
  })
}
