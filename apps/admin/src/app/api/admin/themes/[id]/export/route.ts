/**
 * GET /api/admin/themes/[id]/export — HU-129
 * Descarga la plantilla (tema) como paquete JSON versionado y portable.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { buildTemplatePackage, type Theme } from '@merkiai/database'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getAdminUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const themeId = parseInt(id, 10)
  if (isNaN(themeId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  const db = getAdminDb(user.tenantId)
  const { data, error } = await db.from('themes').select('*').eq('id', themeId).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Plantilla no encontrada' }, { status: 404 })

  const pkg = buildTemplatePackage(data as unknown as Theme)
  const slug = (data as { name?: string }).name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'plantilla'
  return new NextResponse(JSON.stringify(pkg, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="plantilla-${slug}.json"`,
    },
  })
}
