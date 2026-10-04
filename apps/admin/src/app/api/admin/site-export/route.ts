/**
 * GET /api/admin/site-export — HU-123 v1
 * Descarga un backup completo del sitio (Tema + config no sensible + nav +
 * todas las páginas) como JSON versionado. Nunca incluye secretos.
 */
import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { canAccess } from '@/lib/roles'
import { exportSite } from '@merkiai/database'

export async function GET() {
  const user = await getAdminUser()
  if (!user || !canAccess(user.role, 'configuracion')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  try {
    const pkg = await exportSite(getAdminDb(user.tenantId), user.tenantId)
    const date = new Date().toISOString().slice(0, 10)
    return new NextResponse(JSON.stringify(pkg, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="backup-sitio-${date}.json"`,
      },
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
