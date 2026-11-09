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
import { assertInfraConfig, isActiveInfraConfig, toDbTarget, type TenantInfraConfig } from '@merkiai/tenancy'
import { getSecretResolver } from '@/lib/vault'

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

  // HU-362 · destino dedicado resuelto (si el tenant no está en el compartido).
  // Centraliza el acceso a AWS KMS en el control plane: web/admin reciben el
  // DbTarget ya resuelto y no manejan llaves de AWS. Fail-closed: si el tenant
  // es dedicado pero no se puede resolver su destino, 503 (no caer al compartido).
  let dedicatedTarget: { url: string; anonKey: string; serviceKey?: string; jwtSecret?: string } | undefined
  if (tenant.db_ref && tenant.db_ref !== 'shared') {
    try {
      dedicatedTarget = await resolveDedicatedTarget(db, tenant.id, tenant.db_ref)
    } catch (e) {
      return NextResponse.json(
        { error: 'dedicated_resolve_failed', detail: e instanceof Error ? e.message : 'error' },
        { status: 503 },
      )
    }
  }

  return NextResponse.json({
    tenantId: tenant.id,
    subdomain: tenant.subdomain,
    primaryDomain,
    dbRef: tenant.db_ref,
    plan: tenant.plan,
    status: tenant.status,
    entitlements: { features: plan?.features ?? {}, limits: plan?.limits ?? {}, roleAccess: plan?.role_access ?? {} },
    ...(dedicatedTarget ? { dedicatedTarget } : {}),
  })
}

/**
 * Resuelve el `DbTarget` de un tenant dedicado: lee su `tenant_infra_config` y
 * descifra sus secretos por el vault (AWS KMS). Lanza si falta la config, no está
 * `active` o faltan secretos (fail-closed).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveDedicatedTarget(db: any, tenantId: string, dbRef: string) {
  const { data: row, error } = await db
    .from('tenant_infra_config')
    .select('tenant_id, db_ref, db_url, base_url, sentry_dsn, region, secret_ref_anon_key, secret_ref_service_key, secret_ref_jwt_secret, status')
    .eq('tenant_id', tenantId)
    .maybeSingle()
  if (error) throw new Error(`lectura de tenant_infra_config: ${error.message}`)
  if (!row) throw new Error(`tenant dedicado sin tenant_infra_config (db_ref ${dbRef})`)

  const cfg: TenantInfraConfig = {
    tenantId: row.tenant_id, dbRef: row.db_ref, dbUrl: row.db_url,
    baseUrl: row.base_url, sentryDsn: row.sentry_dsn, region: row.region,
    secretRefAnonKey: row.secret_ref_anon_key,
    secretRefServiceKey: row.secret_ref_service_key,
    secretRefJwtSecret: row.secret_ref_jwt_secret,
    status: row.status,
  }
  if (!isActiveInfraConfig(cfg)) throw new Error(`tenant_infra_config no activa (estado ${cfg.status})`)
  assertInfraConfig(cfg)

  const secrets = await getSecretResolver()(cfg)
  return toDbTarget(cfg, secrets)
}
