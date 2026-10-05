import { objectsToCsv, getCoupons } from '@merkiai/database'
import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'

/** GET → exporta cupones a CSV compatible con el importador (HU-132). RLS. */
export async function GET() {
  const user = await getAdminUser()
  if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const coupons = await getCoupons(getAdminDb(user.tenantId)).catch(() => [])
  const headers = ['code', 'type', 'value', 'min_order_amount', 'max_uses', 'expires_at', 'active']
  const rows = coupons.map((c: any) => ({
    code: c.code, type: c.type, value: c.value,
    min_order_amount: c.min_order_amount, max_uses: c.max_uses ?? '',
    expires_at: c.expires_at ? String(c.expires_at).slice(0, 10) : '',
    active: c.active ? 'true' : 'false',
  }))

  const date = new Date().toISOString().slice(0, 10)
  return new NextResponse(objectsToCsv(headers, rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="cupones-${date}.csv"`,
    },
  })
}
