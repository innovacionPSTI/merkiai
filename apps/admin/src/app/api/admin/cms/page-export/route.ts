/**
 * GET /api/admin/cms/page-export?page_key=... — HU-255
 * Descarga una página completa (secciones + ítems) como paquete JSON versionado.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { canAccess } from '@/lib/roles'
import { exportPage, PagePackageError } from '@merkiai/database'

export async function GET(req: NextRequest) {
  const user = await getAdminUser()
  if (!user || !canAccess(user.role, 'contenido')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const pageKey = new URL(req.url).searchParams.get('page_key')
  if (!pageKey) return NextResponse.json({ error: 'page_key requerido' }, { status: 400 })

  try {
    const pkg = await exportPage(pageKey, getAdminDb(user.tenantId))
    return new NextResponse(JSON.stringify(pkg, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="pagina-${pageKey}.json"`,
      },
    })
  } catch (e) {
    if (e instanceof PagePackageError) return NextResponse.json({ error: e.message }, { status: 404 })
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
