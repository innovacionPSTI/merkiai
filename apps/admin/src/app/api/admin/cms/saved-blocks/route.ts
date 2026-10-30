/**
 * /api/admin/cms/saved-blocks — HU-358
 *
 * Biblioteca de bloques guardados del tenant (autoría). Acotado por tenant RLS.
 *   GET                              → lista
 *   POST { section_id, label }       → guarda una sección como bloque reutilizable
 *   POST { insert_id, page_key, order_index? } → inserta uno como nueva sección
 *   DELETE ?id=                      → elimina
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import {
  listSavedBlocks, createSavedBlockFromSection, insertSavedBlock, deleteSavedBlock,
} from '@merkiai/database'

async function requireAdmin() {
  const adminUser = await getAdminUser()
  if (!adminUser) return { adminUser: null, error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  return { adminUser, error: null }
}
const fail = (e: unknown) => NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })

export async function GET() {
  const { adminUser, error } = await requireAdmin()
  if (error) return error
  try {
    return NextResponse.json(await listSavedBlocks(getAdminDb(adminUser!.tenantId)))
  } catch (e) { return fail(e) }
}

export async function POST(req: NextRequest) {
  const { adminUser, error } = await requireAdmin()
  if (error) return error
  const db = getAdminDb(adminUser!.tenantId)
  const body = await req.json()
  try {
    if (body?.insert_id && body?.page_key) {
      const created = await insertSavedBlock(db, { id: Number(body.insert_id), pageKey: String(body.page_key), orderIndex: body.order_index })
      return NextResponse.json(created, { status: 201 })
    }
    if (body?.section_id && body?.label) {
      const saved = await createSavedBlockFromSection(db, { sectionId: Number(body.section_id), label: String(body.label), tenantId: adminUser!.tenantId })
      return NextResponse.json(saved, { status: 201 })
    }
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
  } catch (e) { return fail(e) }
}

export async function DELETE(req: NextRequest) {
  const { adminUser, error } = await requireAdmin()
  if (error) return error
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })
  try {
    await deleteSavedBlock(Number(id), getAdminDb(adminUser!.tenantId))
    return NextResponse.json({ ok: true })
  } catch (e) { return fail(e) }
}
