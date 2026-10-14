import type { Db } from '../client'
import { objectsToCsv } from '../lib/product-import'

/**
 * Reportes de ventas (HU-116). Agrega los pedidos de un rango de fechas para el
 * dashboard de reportes y su exportación. Se EXCLUYEN los cancelados del cálculo
 * de ingresos/ticket. `db` se pasa por parámetro (RLS por tenant / admin).
 */

export interface SalesReportDay { date: string; revenue: number; orders: number }
export interface SalesReportProduct { product_id: number; name: string; qty: number; revenue: number }

export interface SalesReport {
  from: string
  to: string
  revenue: number
  orders: number
  avgTicket: number
  byDay: SalesReportDay[]
  topProducts: SalesReportProduct[]
}

interface OrderRow {
  created_at: string
  total: number | null
  status: string | null
  items: unknown
}

interface ItemRow { product_id?: number; variant_id?: number; product_name?: string; qty?: number; price?: number }

/** YYYY-MM-DD de una fecha ISO (parte local no importa: se usa el prefijo UTC). */
function dayKey(iso: string): string {
  return iso.slice(0, 10)
}

/**
 * Reporte de ventas del rango [from, to] inclusivo (fechas YYYY-MM-DD).
 * `topLimit` controla cuántos productos top devuelve (default 10).
 */
export async function getSalesReport(
  db: Db,
  opts: { from: string; to: string; topLimit?: number },
): Promise<SalesReport> {
  const from = opts.from
  const to = opts.to
  const topLimit = opts.topLimit ?? 10

  // `to` inclusivo → límite superior exclusivo = to + 1 día.
  const toExclusive = new Date(`${to}T00:00:00.000Z`)
  toExclusive.setUTCDate(toExclusive.getUTCDate() + 1)

  const { data } = await db
    .from('orders')
    .select('created_at, total, status, items')
    .gte('created_at', `${from}T00:00:00.000Z`)
    .lt('created_at', toExclusive.toISOString())
    .order('created_at', { ascending: true })

  const rows = (data ?? []) as OrderRow[]
  const paid = rows.filter((o) => o.status !== 'cancelled')

  let revenue = 0
  const byDayMap = new Map<string, { revenue: number; orders: number }>()
  const prodMap = new Map<number, { name: string; qty: number; revenue: number }>()

  for (const o of paid) {
    const total = Number(o.total) || 0
    revenue += total
    const k = dayKey(o.created_at)
    const d = byDayMap.get(k) ?? { revenue: 0, orders: 0 }
    d.revenue += total; d.orders += 1
    byDayMap.set(k, d)

    const items = Array.isArray(o.items) ? (o.items as ItemRow[]) : []
    for (const it of items) {
      const pid = Number(it.product_id ?? it.variant_id ?? 0)
      if (!pid) continue
      const qty = Number(it.qty) || 0
      const line = (Number(it.price) || 0) * qty
      const e = prodMap.get(pid) ?? { name: it.product_name ?? `#${pid}`, qty: 0, revenue: 0 }
      e.qty += qty; e.revenue += line
      prodMap.set(pid, e)
    }
  }

  const orders = paid.length
  const byDay: SalesReportDay[] = [...byDayMap.entries()]
    .map(([date, v]) => ({ date, revenue: v.revenue, orders: v.orders }))
    .sort((a, b) => a.date.localeCompare(b.date))
  const topProducts: SalesReportProduct[] = [...prodMap.entries()]
    .map(([product_id, v]) => ({ product_id, name: v.name, qty: v.qty, revenue: v.revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, topLimit)

  return {
    from, to, revenue, orders,
    avgTicket: orders > 0 ? Math.round(revenue / orders) : 0,
    byDay, topProducts,
  }
}

/** Serializa el detalle diario del reporte a CSV (reusa el serializador común). */
export function salesReportToCsv(report: SalesReport): string {
  const rows = report.byDay.map((d) => ({
    fecha: d.date,
    pedidos: d.orders,
    ingresos: d.revenue,
  }))
  return objectsToCsv(['fecha', 'pedidos', 'ingresos'], rows)
}
