import { NextRequest, NextResponse } from 'next/server'
import { normalizeLocale } from '@merkiai/i18n'
import { safeReturnPath } from '@merkiai/tenancy/security'
import { getLocaleConfig } from '@/lib/request-locale'
import { localizedPath, LOCALE_COOKIE } from '@/lib/locale-routing'

/**
 * Cambio de idioma explícito (E28 · HU-462): guarda la elección en cookie y
 * lleva a la misma página en ese idioma. Solo acepta locales publicados por la
 * tienda y rutas relativas del mismo sitio (sin open redirect).
 */
export async function GET(req: NextRequest) {
  const config = await getLocaleConfig()
  const requested = normalizeLocale(req.nextUrl.searchParams.get('set'))
  const next = safeReturnPath(req.nextUrl.searchParams.get('next'), '/')
  const host = (req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? '').toLowerCase().replace(/:\d+$/, '')
  if (!requested || !config.locales.includes(requested)) return NextResponse.redirect(new URL(next, req.url))
  const res = NextResponse.redirect(new URL(localizedPath(next, requested, host, config), req.url))
  res.cookies.set(LOCALE_COOKIE, requested, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
  return res
}
