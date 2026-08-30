import { NextRequest, NextResponse } from 'next/server'
import { stackServerApp } from './stack'

/**
 * Middleware del panel admin Merkiai.
 *
 * Responsabilidades:
 * 1. Inyectar header x-pathname para que el layout pueda leer la ruta actual
 * 2. Bloquear /handler/sign-up (signup deshabilitado en admin)
 * 3. Redirigir usuarios no autenticados a /handler/sign-in
 *
 * La verificación de ROL ocurre en el layout (Server Component),
 * no aquí, para evitar limitaciones del runtime de edge con Supabase.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Inyectar pathname en headers para que el layout lo lea
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)

  // ── Bloquear sign-up ─────────────────────────────────────────────────────
  // El admin no permite auto-registro. Los usuarios solo puede crearlos el super_admin.
  if (pathname === '/handler/sign-up' || pathname.startsWith('/handler/sign-up/')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ── Login branded + rutas del handler (password-reset, etc.): públicas ────
  if (pathname === '/login' || pathname.startsWith('/handler')) {
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // ── Página de no-autorizado: permitir siempre ─────────────────────────────
  if (pathname === '/no-autorizado') {
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // ── API interna (server-to-server): NO exigir sesión aquí ──────────────────
  // Estos endpoints (p.ej. /api/internal/owners, HU-209) autentican con
  // `x-internal-secret` en la propia ruta. Si el middleware exigiera sesión,
  // redirigiría el POST del control plane a /login (307) y el perfil nunca se
  // crearía — sin error visible. Dejar pasar y que la ruta valide el secreto.
  if (pathname.startsWith('/api/internal')) {
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // ── Verificar sesión Stack Auth ───────────────────────────────────────────
  const user = await stackServerApp.getUser()
  if (!user) {
    const signInUrl = new URL('/login', request.url)
    signInUrl.searchParams.set('after_auth_return_to', pathname)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
