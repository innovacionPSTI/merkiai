import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const DRAFT_SECRET = process.env.DRAFT_SECRET ?? 'vps-draft-preview'
const COOKIE_NAME  = '__merkiai_draft'
const COOKIE_MAX_AGE = 60 * 60 // 1 hour

/**
 * GET /api/draft/enable?slug=<slug>&secret=<DRAFT_SECRET>
 *
 * Sets a short-lived cookie that allows the blog post page to render
 * unpublished (draft) articles. After setting the cookie, redirects
 * to /blog/<slug>?draft=1 so the page shows a draft banner.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const secret = searchParams.get('secret')
  const slug   = searchParams.get('slug')

  if (secret !== DRAFT_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
  }
  if (!slug) {
    return NextResponse.json({ error: 'slug is required' }, { status: 400 })
  }

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, '1', {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })

  // Multi-tenant: redirigir al MISMO host de la petición (el dominio/subdominio
  // del tenant), no a un NEXT_PUBLIC_SITE_URL fijo — así se conserva el tenant y
  // la cookie de borrador (host-scoped) aplica en el destino.
  return NextResponse.redirect(new URL(`/blog/${slug}?draft=1`, req.url))
}

/**
 * GET /api/draft/disable
 * Clears the draft cookie.
 */
export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
  return NextResponse.json({ ok: true })
}
