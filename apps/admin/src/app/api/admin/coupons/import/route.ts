import { parseCouponsCsv, COUPON_IMPORT_TEMPLATE, getCoupons, createCoupon, updateCoupon } from '@merkiai/database'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'

async function requireAdmin() {
  const user = await getAdminUser()
  if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) return null
  return user
}

/** GET → plantilla CSV de cupones. */
export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  return new NextResponse(COUPON_IMPORT_TEMPLATE, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="plantilla-cupones.csv"',
    },
  })
}

/**
 * POST → importa cupones por CSV (HU-132). Identidad por `code`. Reusa el motor
 * de parseo y el `CsvImportModal` genérico. Acotado por tenant vía RLS.
 * Body: { csv, mode?: 'create'|'upsert', preview?: boolean }.
 */
export async function POST(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const csv: string = typeof body?.csv === 'string' ? body.csv : ''
  const previewOnly = body?.preview === true
  const mode: 'create' | 'upsert' = body?.mode === 'upsert' ? 'upsert' : 'create'
  if (!csv.trim()) return NextResponse.json({ error: 'CSV vacío' }, { status: 400 })

  const { coupons, errors: parseErrors } = parseCouponsCsv(csv)
  const db = getAdminDb(user.tenantId)

  const existing = await getCoupons(db).catch(() => [])
  const idByCode = new Map<string, number>(existing.map((c: any) => [String(c.code).toUpperCase(), c.id]))

  const skipped: { slug: string; reason: string }[] = []
  const toCreate: typeof coupons = []
  const toUpdate: typeof coupons = []
  for (const c of coupons) {
    if (idByCode.has(c.code)) {
      if (mode === 'upsert') toUpdate.push(c)
      else skipped.push({ slug: c.code, reason: 'Ya existe un cupón con ese código' })
    } else toCreate.push(c)
  }

  const summary = {
    mode,
    parsed: coupons.length,
    toCreate: toCreate.length,
    toUpdate: toUpdate.length,
    skipped,
    parseErrors,
    created: 0,
    updated: 0,
    errors: [] as { slug: string; message: string }[],
  }

  if (previewOnly) return NextResponse.json({ preview: true, ...summary })

  for (const c of toCreate) {
    try {
      await createCoupon({
        code: c.code, type: c.type, value: c.value,
        min_order_amount: c.min_order_amount, max_uses: c.max_uses,
        expires_at: c.expires_at, active: c.active,
      }, db, user.tenantId)
      summary.created++
    } catch (e) {
      summary.errors.push({ slug: c.code, message: e instanceof Error ? e.message : 'Error al crear' })
    }
  }
  for (const c of toUpdate) {
    const id = idByCode.get(c.code)!
    try {
      await updateCoupon(id, {
        type: c.type, value: c.value, min_order_amount: c.min_order_amount,
        max_uses: c.max_uses, expires_at: c.expires_at, active: c.active,
      }, db)
      summary.updated++
    } catch (e) {
      summary.errors.push({ slug: c.code, message: e instanceof Error ? e.message : 'Error al actualizar' })
    }
  }

  return NextResponse.json(summary, { status: 201 })
}
