/**
 * Montos del panel por moneda (E28 · HU-467 AC-5). Cada pedido se muestra en su
 * moneda y los totales se agrupan por moneda: nunca se suman COP con USD.
 */
import { formatMoney } from '@merkiai/i18n'
import { sumByCurrency, type CurrencyAmount } from '@merkiai/database'

/** Monto en la moneda del dato (pedidos anteriores a la multimoneda → COP). */
export function moneyIn(amount: number | null | undefined, currency?: string | null): string {
  return formatMoney(amount ?? 0, { currency: currency || 'COP' })
}

/** "COP 1.200.000 · USD 340,00": un total por moneda, la base primero. */
export function formatTotals(totals: CurrencyAmount[], baseCurrency = 'COP'): string {
  if (totals.length === 0) return formatMoney(0, { currency: baseCurrency })
  return totals.map((t) => formatMoney(t.amount, { currency: t.currency })).join(' · ')
}

/** Suma `total` de pedidos agrupando por su moneda y lo formatea. */
export function orderTotals(rows: Array<{ total?: number | null; currency?: string | null }>, baseCurrency = 'COP'): string {
  return formatTotals(sumByCurrency(rows, (r) => ({ amount: r.total, currency: r.currency }), baseCurrency), baseCurrency)
}
