import { getSalesReport, salesReportToCsv } from '@merkiai/database'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { userCanAccess } from '@/lib/roles'

/**
 * GET /api/admin/reports/sales?from=YYYY-MM-DD&to=YYYY-MM-DD&format=json|csv
 * Reporte de ventas del rango (HU-116). Acotado por tenant (RLS) y gated por el
 * acceso a Pedidos. CSV = detalle diario; JSON = métricas + top productos.
 */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export async function GET(req: NextRequest) {
  const user = await getAdminUser()
  if (!user || !userCanAccess(user, 'pedidos')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const sp = req.nextUrl.searchParams
  const from = sp.get('from') ?? ''
  const to = sp.get('to') ?? ''
  if (!DATE_RE.test(from) || !DATE_RE.test(to)) {
    return NextResponse.json({ error: 'Rango inválido (from/to = YYYY-MM-DD)' }, { status: 400 })
  }
  if (from > to) {
    return NextResponse.json({ error: 'La fecha inicial no puede ser mayor que la final' }, { status: 400 })
  }

  const db = getAdminDb(user.tenantId)
  const report = await getSalesReport(db, { from, to })

  if (sp.get('format') === 'csv') {
    const csv = salesReportToCsv(report)
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="ventas-${from}_a_${to}.csv"`,
      },
    })
  }

  return NextResponse.json(report)
}
