import { NextRequest, NextResponse } from 'next/server'
import { stackServerApp } from './stack'

/**
 * Middleware del control plane.
 *  - `/handler/*` (Stack Auth) y `/api/internal/*` (máquina-a-máquina, gated por
 *    `x-internal-secret`) pasan sin sesión.
 *  - El resto (consola) exige sesión Stack Auth; el permiso `platform:operate`
 *    se verifica en el server component (`requirePlatformOperator`).
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/login' || pathname.startsWith('/handler') || pathname.startsWith('/api/internal')) {
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
