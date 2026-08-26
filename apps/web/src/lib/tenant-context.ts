/**
 * Resolución de tenant por host (E17 · HU-157).
 *
 * Deriva el tenant activo a partir del Host de la petición (dominio propio o
 * subdominio). Es la costura que desengancha `getTenantDb()` del tenant por
 * defecto. La FUENTE DE DATOS del registro `tenants` (BD de plataforma) se
 * inyecta como `TenantResolver` — ver decisiones abiertas abajo.
 *
 * ── Decisiones abiertas (no resueltas aún) ──────────────────────────────────
 *  1. **Origen del lookup host→tenant**: el registro `tenants` vive en la BD de
 *     plataforma (solo control plane). Opciones:
 *       a) API interna de resolución del control plane (recomendado; aún no existe).
 *       b) Path de lectura acotado a `tenants` desde el plano de tienda (rompe el
 *          límite service-role; requiere policy/rol de solo-lectura mínimo).
 *     Interim (sin control plane, sin clientes): resolver = tenant por defecto.
 *  2. **Renderizado**: leer el Host hace la página **dinámica** (rompe ISR). El
 *     storefront multi-host suele ser dinámico o con caché por host. Decidir por
 *     página al activar la resolución real.
 * ---------------------------------------------------------------------------
 */
import { headers } from 'next/headers'
import type { PlanEntitlements } from '@merkiai/tenancy'

export interface ResolvedTenant {
  tenantId: string
  subdomain: string | null
  primaryDomain: string | null
  dbRef?: string | null
  status?: string | null
  plan?: string | null
  entitlements?: PlanEntitlements | null
}

/** Contrato del origen de datos host→tenant (se implementará contra el control plane). */
export interface TenantResolver {
  resolveByHost(host: string): Promise<ResolvedTenant | null>
}

const DEFAULT_TENANT: ResolvedTenant = {
  tenantId: process.env.DEFAULT_TENANT_ID ?? '00000000-0000-0000-0000-000000000001',
  subdomain: 'default',
  primaryDomain: null,
}

/** Resolver interim: single-tenant → siempre el tenant por defecto. */
export const singleTenantResolver: TenantResolver = {
  async resolveByHost() {
    return DEFAULT_TENANT
  },
}

/**
 * Resolver real: consulta la **API interna del control plane** (que lee la BD de
 * plataforma), sin dar a web acceso directo al registro `tenants`.
 * Requiere `CONTROL_PLANE_URL` + `INTERNAL_API_SECRET`.
 */
export const controlPlaneResolver: TenantResolver = {
  async resolveByHost(host: string) {
    const base = process.env.CONTROL_PLANE_URL
    const secret = process.env.INTERNAL_API_SECRET
    if (!base || !secret) return null
    try {
      const res = await fetch(
        `${base.replace(/\/$/, '')}/api/internal/resolve-tenant?host=${encodeURIComponent(host)}`,
        { headers: { 'x-internal-secret': secret }, cache: 'no-store' },
      )
      if (!res.ok) return null
      const d = await res.json()
      if (!d?.tenantId) return null
      return {
        tenantId: d.tenantId,
        subdomain: d.subdomain ?? null,
        primaryDomain: d.primaryDomain ?? null,
        dbRef: d.dbRef ?? null,
        status: d.status ?? null,
        plan: d.plan ?? null,
        entitlements: d.entitlements ?? null,
      }
    } catch {
      return null
    }
  },
}

/** Resolver por defecto: control plane si está configurado; si no, single-tenant. */
function defaultResolver(): TenantResolver {
  return process.env.CONTROL_PLANE_URL && process.env.INTERNAL_API_SECRET
    ? controlPlaneResolver
    : singleTenantResolver
}

// Caché por host (por instancia) con TTL corto: evita golpear el control plane
// en cada request pero permite que cambios de estado/plan del tenant se
// propaguen pronto. Solo se cachean resoluciones EXITOSAS (el fallback al
// tenant por defecto no se cachea, para reintentar si el control plane falló).
const RESOLVE_TTL_MS = 60_000
const cache = new Map<string, { value: ResolvedTenant; expires: number }>()

/**
 * Resuelve el tenant de la petición actual a partir del Host.
 * Fail-open al tenant por defecto si no hay host o el resolver no encuentra
 * (interim single-tenant / error transitorio del control plane).
 */
export async function resolveTenant(resolver: TenantResolver = defaultResolver()): Promise<ResolvedTenant> {
  const h = await headers()
  const host = (h.get('x-forwarded-host') ?? h.get('host') ?? '').toLowerCase().replace(/:\d+$/, '')
  if (!host) return DEFAULT_TENANT

  const hit = cache.get(host)
  if (hit && hit.expires > Date.now()) return hit.value

  const resolved = await resolver.resolveByHost(host)
  if (!resolved) return DEFAULT_TENANT // no cachear el fallback

  cache.set(host, { value: resolved, expires: Date.now() + RESOLVE_TTL_MS })
  return resolved
}
