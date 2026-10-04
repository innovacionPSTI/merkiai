/**
 * Vista previa por-tenant (HU-128). Reemplaza el DRAFT_SECRET global del blog.
 *   GET  /api/preview?token=<tokenPorTenant>&path=/   → valida el token contra el
 *        tenant resuelto por Host, pone cookie de preview y redirige a `path`
 *        (mismo host → conserva tenant y cookie host-scoped).
 *   DELETE /api/preview                               → sale del modo preview.
 *
 * El token lo genera el admin con `makePreviewToken(tenantId, PREVIEW_SIGNING_SECRET)`;
 * aquí se verifica recomputándolo para el tenant del Host → un token solo sirve
 * en su propia tienda.
 */
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyPreviewToken } from '@merkiai/database'
import { resolveTenant } from '@/lib/tenant-context'
import { PREVIEW_COOKIE } from '@/lib/preview'

const COOKIE_MAX_AGE = 60 * 60 // 1h

/** Solo rutas internas (evita open-redirect). */
function safePath(path: string | null): string {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return '/'
  return path
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  const { tenantId } = await resolveTenant()
  if (!verifyPreviewToken(token, tenantId, process.env.PREVIEW_SIGNING_SECRET)) {
    return NextResponse.json({ error: 'Invalid preview token' }, { status: 401 })
  }

  // La cookie guarda el TOKEN (no '1'): las páginas lo re-verifican en cada
  // request contra el tenant del Host → una cookie forjada no activa el preview.
  const cookieStore = await cookies()
  cookieStore.set(PREVIEW_COOKIE, token!, { httpOnly: true, sameSite: 'lax', maxAge: COOKIE_MAX_AGE, path: '/' })

  // Mismo host de la petición (dominio/subdominio del tenant).
  return NextResponse.redirect(new URL(safePath(searchParams.get('path')), req.url))
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete(PREVIEW_COOKIE)
  return NextResponse.json({ ok: true })
}
