/**
 * POST /api/admin/cms/page-import — HU-255
 * Importa un paquete de página como una página NUEVA en borrador (enabled=false).
 * Body: { package, key, slug, label? }  (o el paquete directo + key/slug/label).
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { canAccess } from '@/lib/roles'
import { importPagePackage, PagePackageError } from '@merkiai/database'

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const KEY_RE = /^[a-z0-9_-]{2,40}$/

export async function POST(req: NextRequest) {
  const user = await getAdminUser()
  if (!user || !canAccess(user.role, 'contenido')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })

  const pkg = (body.kind === 'merkiai.page') ? body : body.package
  const key = String(body.key ?? '').trim().toLowerCase()
  const slug = String(body.slug ?? '').trim().toLowerCase()
  const label = typeof body.label === 'string' ? body.label : undefined

  if (!KEY_RE.test(key)) return NextResponse.json({ error: 'key inválida (a-z, 0-9, -, _, 2-40)' }, { status: 400 })
  if (!SLUG_RE.test(slug)) return NextResponse.json({ error: 'slug inválido (a-z, 0-9, guiones)' }, { status: 400 })

  try {
    const page = await importPagePackage(pkg, getAdminDb(user.tenantId), { key, slug, label })
    return NextResponse.json({ page }, { status: 201 })
  } catch (e) {
    if (e instanceof PagePackageError) return NextResponse.json({ error: e.message }, { status: 422 })
    const msg = e instanceof Error ? e.message : 'Error al importar'
    // Colisión de key/slug → 409
    const status = /duplicate|unique|exists/i.test(msg) ? 409 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
