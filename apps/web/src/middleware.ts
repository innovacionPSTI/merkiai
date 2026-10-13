import { NextRequest, NextResponse } from 'next/server'
import { stackServerApp } from './stack'

/**
 * Middleware de Merkiai Web.
 *
 * 1. Modo mantenimiento: si está activo redirige todo a /maintenance
 *    (excepto la propia página, APIs y rutas de auth).
 *    El estado se cachea 60 s en memoria para no golpear la BD en cada request.
 *
 * 2. Auth guard: protege /account/* y redirige al login si no hay sesión.
 */

let maintenanceCache: { value: boolean; expiresAt: number } | null = null
const MAINTENANCE_TTL_MS = 60_000

// ── HU-194: gate de suspensión por tenant (best-effort) ────────────────────────
// Solo activo si el control plane está configurado (CONTROL_PLANE_URL + secret);
// si no, no hace nada (single-tenant sin cambios).
// `found`: true = tenant resuelto · false = 404 definitivo (host sin tenant) ·
// null = desconocido (sin control plane o error transitorio → no redirigir).
type TenantResolution = { found: boolean | null; status: string | null; primaryDomain: string | null; subdomain: string | null }
const tenantStatusCache = new Map<string, { value: TenantResolution; expiresAt: number }>()
const TENANT_STATUS_TTL_MS = 30_000

async function resolveTenantInfo(host: string): Promise<TenantResolution> {
  const base = process.env.CONTROL_PLANE_URL
  const secret = process.env.INTERNAL_API_SECRET
  if (!base || !secret) return { found: null, status: null, primaryDomain: null, subdomain: null }
  const key = host.toLowerCase()
  const now = Date.now()
  const cached = tenantStatusCache.get(key)
  if (cached && cached.expiresAt > now) return cached.value
  try {
    const res = await fetch(
      `${base.replace(/\/$/, '')}/api/internal/resolve-tenant?host=${encodeURIComponent(key)}`,
      { headers: { 'x-internal-secret': secret }, cache: 'no-store' },
    )
    let value: TenantResolution
    if (res.ok) {
      const d = await res.json()
      value = { found: true, status: (d?.status as string) ?? null, primaryDomain: (d?.primaryDomain as string) ?? null, subdomain: (d?.subdomain as string) ?? null }
    } else if (res.status === 404) {
      value = { found: false, status: null, primaryDomain: null, subdomain: null } // host sin tenant (definitivo)
    } else {
      value = { found: null, status: null, primaryDomain: null, subdomain: null } // 401/5xx/etc → desconocido, no redirigir
    }
    tenantStatusCache.set(key, { value, expiresAt: now + TENANT_STATUS_TTL_MS })
    return value
  } catch {
    return { found: null, status: null, primaryDomain: null, subdomain: null }
  }
}

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'merkiai.com'

/** Hosts que NUNCA se redirigen (evita loop del apex/landing). */
const NO_REDIRECT_HOSTS = new Set(['merkiai.com'])

async function checkMaintenanceMode(baseUrl: string): Promise<boolean> {
  const now = Date.now()
  if (maintenanceCache && maintenanceCache.expiresAt > now) return maintenanceCache.value
  try {
    const res = await fetch(`${baseUrl}/api/maintenance-status`, { cache: 'no-store' })
    if (res.ok) {
      const { maintenance_mode } = await res.json()
      maintenanceCache = { value: !!maintenance_mode, expiresAt: now + MAINTENANCE_TTL_MS }
      return !!maintenance_mode
    }
  } catch {
    // No bloquear la navegación si la API falla
  }
  return false
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rutas inmunes al modo mantenimiento
  const bypassMaintenance =
    pathname === '/maintenance' ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/handler') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')

  if (!bypassMaintenance) {
    const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`
    if (await checkMaintenanceMode(baseUrl)) {
      return NextResponse.redirect(new URL('/maintenance', request.url))
    }
  }

  // ── HU-157/HU-194: resolución de tenant por host ──────────────────────────
  if (
    !bypassMaintenance &&
    pathname !== '/servicio-pausado' &&
    !pathname.startsWith('/api/webhooks') // los webhooks deben seguir llegando
  ) {
    const host = request.nextUrl.host.toLowerCase().replace(/:\d+$/, '')
    const info = await resolveTenantInfo(host)

    // HU-157: host SIN tenant (404 definitivo) → landing en merkiai.com.
    // Solo con resolución definitiva (found === false); ante error/duda no se
    // redirige (fail-safe, no cortar tráfico). El apex nunca se redirige (loop).
    if (info.found === false && !NO_REDIRECT_HOSTS.has(host)) {
      return NextResponse.redirect('https://merkiai.com')
    }

    // HU-194: tenant suspendido/cancelado → "servicio pausado".
    if (info.status === 'suspended' || info.status === 'canceled') {
      return NextResponse.rewrite(new URL('/servicio-pausado', request.url))
    }

    // HU-279: dominio canónico. Si el tenant tiene dominio propio y la tienda se
    // abre por su subdominio de plataforma (<sub>.merkiai.com), se redirige 301
    // al dominio propio para unificar canónicas, cookies y SEO. Las rutas /api/*
    // ya quedan excluidas (bypassMaintenance) → webhooks por subdominio siguen
    // funcionando. Nunca redirige si ya se está en el dominio propio.
    if (
      info.found === true &&
      info.primaryDomain &&
      info.subdomain &&
      host === `${info.subdomain}.${ROOT_DOMAIN}` &&
      host !== info.primaryDomain
    ) {
      const url = new URL(request.url)
      url.host = info.primaryDomain
      url.port = ''
      url.protocol = 'https:'
      return NextResponse.redirect(url, 301)
    }
  }

  // Stack Auth handler: nunca proteger
  if (pathname.startsWith('/handler')) return NextResponse.next()

  // Rutas protegidas: /account/*
  if (pathname.startsWith('/account')) {
    const user = await stackServerApp.getUser()
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('returnTo', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
