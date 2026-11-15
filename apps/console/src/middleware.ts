import { NextRequest, NextResponse } from 'next/server'
import { stackServerApp } from './stack'
import { isCrossSiteMutation } from '@merkiai/tenancy/security'

/**
 * Middleware del control plane.
 *  - `/handler/*` (Stack Auth) y `/api/internal/*` (máquina-a-máquina, gated por
 *    `x-internal-secret`) pasan sin sesión.
 *  - `/api/billing/*` (webhooks del proveedor de cobro; autenticados por firma HMAC)
 *    pasa sin sesión.
 *  - El resto (consola) exige sesión Stack Auth; el permiso `platform:operate`
 *    se verifica en el server component (`requirePlatformOperator`).
 */

/**
 * Hardening · CSRF por Origin (defensa en profundidad, además de SameSite y la
 * protección propia de las Server Actions): una petición a /api que muta estado
 * desde OTRO origen se rechaza. Server-to-server (sin Origin: webhooks, crons,
 * API interna) no se ve afectado.
 */
function crossSiteBlocked(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl
  if (!pathname.startsWith('/api/')) return null
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  if (isCrossSiteMutation(request.method, request.headers.get('origin'), host)) {
    return NextResponse.json({ error: 'Origen no permitido' }, { status: 403 })
  }
  return null
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const csrf = crossSiteBlocked(request)
  if (csrf) return csrf

  if (pathname === '/login' || pathname.startsWith('/handler') || pathname.startsWith('/api/internal') || pathname.startsWith('/api/billing/')) {
    return NextResponse.next()
  }

  const user = await stackServerApp.getUser()
  if (!user) {
    const signInUrl = new URL('/login', request.url)
    signInUrl.searchParams.set('after_auth_return_to', pathname)
    return NextResponse.redirect(signInUrl)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
