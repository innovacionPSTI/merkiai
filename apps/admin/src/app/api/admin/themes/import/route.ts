/**
 * POST /api/admin/themes/import — HU-129
 * Importa un paquete de plantilla como un tema NUEVO e INACTIVO (borrador).
 * Body: el paquete JSON, o { package, name? } para renombrar al importar.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { importTemplatePackage, TemplatePackageError } from '@merkiai/database'

async function requireAdmin() {
  const user = await getAdminUser()
  if (!user) return { user: null, error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  if (user.role !== 'super_admin' && user.role !== 'admin' && user.role !== 'gestor_tienda') {
    return { user: null, error: NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 }) }
  }
  return { user, error: null }
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAdmin()
  if (error) return error

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })

  // Acepta el paquete directo o envuelto en { package, name }.
  const pkg = (body.kind === 'merkiai.template') ? body : body.package
  const nameOverride = typeof body.name === 'string' ? body.name : undefined

  try {
    const theme = await importTemplatePackage(pkg, getAdminDb(user!.tenantId), nameOverride)
    return NextResponse.json({ theme }, { status: 201 })
  } catch (e) {
    if (e instanceof TemplatePackageError) {
      return NextResponse.json({ error: e.message }, { status: 422 })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error al importar' }, { status: 500 })
  }
}
