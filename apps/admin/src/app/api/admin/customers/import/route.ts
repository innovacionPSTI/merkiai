import { parseCustomersCsv, CUSTOMER_IMPORT_TEMPLATE } from '@merkiai/database'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { canAccess } from '@/lib/roles'

/** GET → plantilla CSV de clientes. */
export async function GET() {
  const user = await getAdminUser()
  if (!user || !canAccess(user.role, 'clientes')) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  return new NextResponse(CUSTOMER_IMPORT_TEMPLATE, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="plantilla-clientes.csv"',
    },
  })
}

/**
 * POST → importa clientes por CSV (HU-132). Identidad por `email` (único por
 * tenant). Crea registros de contacto (stack_id = NULL; no toca Stack Auth).
 * Acotado por tenant vía RLS. Body: { csv, mode?: 'create'|'upsert', preview? }.
 */
export async function POST(req: NextRequest) {
  const user = await getAdminUser()
  if (!user || !canAccess(user.role, 'clientes')) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const tenantId = user.tenantId

  const body = await req.json().catch(() => ({}))
  const csv: string = typeof body?.csv === 'string' ? body.csv : ''
  const previewOnly = body?.preview === true
  const mode: 'create' | 'upsert' = body?.mode === 'upsert' ? 'upsert' : 'create'
  if (!csv.trim()) return NextResponse.json({ error: 'CSV vacío' }, { status: 400 })

  const { customers, errors: parseErrors } = parseCustomersCsv(csv)
  const db = getAdminDb(tenantId)

  const { data: existing } = await db.from('customers').select('id, email')
  const idByEmail = new Map<string, string>((existing ?? []).map((c: any) => [String(c.email).toLowerCase(), c.id]))

  const skipped: { slug: string; reason: string }[] = []
  const toCreate: typeof customers = []
  const toUpdate: typeof customers = []
  for (const c of customers) {
    if (idByEmail.has(c.email)) {
      if (mode === 'upsert') toUpdate.push(c)
      else skipped.push({ slug: c.email, reason: 'Ya existe un cliente con ese email' })
    } else toCreate.push(c)
  }

  const summary = {
    mode, parsed: customers.length,
    toCreate: toCreate.length, toUpdate: toUpdate.length,
    skipped, parseErrors,
    created: 0, updated: 0,
    errors: [] as { slug: string; message: string }[],
  }

  if (previewOnly) return NextResponse.json({ preview: true, ...summary })

  if (toCreate.length > 0) {
    const { error } = await db.from('customers').insert(
      toCreate.map((c) => ({ email: c.email, name: c.name, phone: c.phone, tenant_id: tenantId })),
    )
    if (error) summary.errors.push({ slug: '(lote)', message: error.message })
    else summary.created = toCreate.length
  }

  for (const c of toUpdate) {
    const id = idByEmail.get(c.email)!
    const { error } = await db.from('customers').update({ name: c.name, phone: c.phone }).eq('id', id)
    if (error) summary.errors.push({ slug: c.email, message: error.message })
    else summary.updated++
  }

  return NextResponse.json(summary, { status: 201 })
}
