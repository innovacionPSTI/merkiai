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
const tenantStatusCache = new Map<string, { status: string | null; expiresAt: number }>()
const TENANT_STATUS_TTL_MS = 30_000

async function resolveTenantStatus(host: string): Promise<string | null> {
  const base = process.env.CONTROL_PLANE_URL
  const secret = process.env.INTERNAL_API_SECRET
  if (!base || !secret) return null
  const key = host.toLowerCase()
  const now = Date.now()
  const cached = tenantStatusCache.get(key)
  if (cached && cached.expiresAt > now) return cached.status
  try {
    const res = await fetch(
      `${base.replace(/\/$/, '')}/api/internal/resolve-tenant?host=${encodeURIComponent(key)}`,
      { headers: { 'x-internal-secret': secret }, cache: 'no-store' },
    )
    const status = res.ok ? (((await res.json())?.status as string) ?? null) : null
    tenantStatusCache.set(key, { status, expiresAt: now + TENANT_STATUS_TTL_MS })
    return status
  } catch {
    return null
  }
}

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

  // ── HU-194: si el tenant está suspendido, mostrar "servicio pausado" ──────
  if (
    !bypassMaintenance &&
    pathname !== '/servicio-pausado' &&
    !pathname.startsWith('/api/webhooks') // los webhooks deben seguir llegando
  ) {
    const status = await resolveTenantStatus(request.nextUrl.host)
    if (status === 'suspended' || status === 'canceled') {
      return NextResponse.rewrite(new URL('/servicio-pausado', request.url))
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
