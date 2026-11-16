/**
 * queries/market-pricing.ts — Multimoneda por mercado (E28 · HU-467 · ADR-011 §2.8).
 *
 * Todo PURO (sin BD) para poder probarlo y usarlo igual en el storefront, el
 * checkout server-side y el admin:
 *   - Precio local de un mercado: la lista de precios del mercado (ya en su
 *     moneda) o, si no tiene entrada, la conversión del precio base con una
 *     **tasa fija** configurable y una **regla de redondeo** (AC-1).
 *   - Impuesto por país: tasa del mercado, incluida o no en el precio (AC-4).
 *   - Pasarelas compatibles con la moneda (AC-3).
 * Mercado en la moneda base → el precio base sin tocar (cero regresión).
 */
import { currencyDecimals } from '@merkiai/i18n'

export const PRICE_ROUNDINGS = ['auto', 'none', 'integer', 'nearest_10', 'nearest_100', 'nearest_1000', 'x99', 'x90'] as const
export type PriceRounding = (typeof PRICE_ROUNDINGS)[number]

/** Campos de precio de un mercado (subconjunto de `Market`). */
export interface MarketPricing {
  currency: string
  /** 1 unidad de la moneda base = `fx_rate` unidades de la moneda del mercado. */
  fx_rate: number | null
  price_rounding: PriceRounding
  /** Porcentaje (19 = 19 %). 0 = sin impuesto discriminado. */
  tax_rate: number
  /** true: los precios ya incluyen el impuesto (se discrimina); false: se suma al total. */
  tax_included: boolean
  price_list_id: number | null
}

export function isPriceRounding(v: unknown): v is PriceRounding {
  return (PRICE_ROUNDINGS as readonly string[]).includes(String(v))
}

function toDecimals(n: number, decimals: number): number {
  const f = 10 ** decimals
  return Math.round((n + Number.EPSILON) * f) / f
}

/**
 * Redondea un precio convertido. `auto` = a los decimales de la moneda (COP → 0,
 * USD → 2). `x99`/`x90` = terminación comercial (12.30 → 12.99) en monedas con
 * decimales; en monedas sin decimales equivalen a `integer`.
 */
export function roundPrice(amount: number, currency: string, rule: PriceRounding = 'auto'): number {
  if (!Number.isFinite(amount)) return 0
  const decimals = currencyDecimals(currency)
  switch (rule) {
    case 'none': return toDecimals(amount, Math.max(decimals, 2))
    case 'integer': return Math.round(amount)
    case 'nearest_10': return Math.round(amount / 10) * 10
    case 'nearest_100': return Math.round(amount / 100) * 100
    case 'nearest_1000': return Math.round(amount / 1000) * 1000
    case 'x99':
    case 'x90': {
      if (decimals === 0) return Math.round(amount)
      const cents = rule === 'x99' ? 0.99 : 0.9
      const whole = Math.floor(amount)
      const candidate = whole + cents
      return toDecimals(candidate >= amount - 1e-9 ? candidate : whole + 1 + cents, 2)
    }
    default: return toDecimals(amount, decimals)
  }
}

/**
 * Convierte un precio de la moneda base a la del mercado. Misma moneda → igual.
 * Sin tasa configurada → `null` (el producto no se puede vender en ese mercado).
 */
export function convertFromBase(amount: number, market: Pick<MarketPricing, 'currency' | 'fx_rate' | 'price_rounding'>, baseCurrency: string): number | null {
  if (market.currency.toUpperCase() === baseCurrency.toUpperCase()) return amount
  if (!market.fx_rate || market.fx_rate <= 0) return null
  return roundPrice(amount * market.fx_rate, market.currency, market.price_rounding)
}

/**
 * Precio local (AC-1): la entrada de la lista de precios del mercado gana (ya está
 * en su moneda); si no hay, conversión con tasa fija y redondeo.
 */
export function marketPrice(
  input: { basePrice: number; listPrice?: number | null },
  market: Pick<MarketPricing, 'currency' | 'fx_rate' | 'price_rounding'>,
  baseCurrency: string,
): number | null {
  if (input.listPrice != null && Number.isFinite(input.listPrice)) return input.listPrice
  return convertFromBase(input.basePrice, market, baseCurrency)
}

export interface TaxBreakdown {
  /** Impuesto contenido o agregado, en la moneda del pedido. */
  tax: number
  /** Total final: igual al gravable si el impuesto está incluido; gravable + impuesto si no. */
  total: number
}

/**
 * Impuesto por país (AC-4) sobre la base gravable (productos − descuentos + envío).
 * Incluido: se discrimina sin cambiar el total. No incluido: se suma.
 */
export function computeTax(taxable: number, market: Pick<MarketPricing, 'tax_rate' | 'tax_included' | 'currency'>): TaxBreakdown {
  const base = Math.max(0, taxable)
  const rate = Math.max(0, Number(market.tax_rate) || 0) / 100
  const decimals = currencyDecimals(market.currency)
  if (rate === 0) return { tax: 0, total: base }
  if (market.tax_included) return { tax: toDecimals(base - base / (1 + rate), decimals), total: base }
  const tax = toDecimals(base * rate, decimals)
  return { tax, total: toDecimals(base + tax, decimals) }
}

/**
 * Monedas que acepta cada pasarela (AC-3). Las colombianas operan en COP; PayZen
 * y MercadoPago dependen del contrato/país de la cuenta (se listan las habituales).
 */
export const PROVIDER_CURRENCIES: Record<string, readonly string[]> = {
  wompi: ['COP'],
  bold: ['COP'],
  tucompra: ['COP'],
  merkiai_pagos: ['COP'],
  mercadopago: ['COP', 'MXN', 'ARS', 'BRL', 'CLP', 'PEN', 'UYU'],
  payzen: ['COP', 'USD', 'EUR', 'MXN', 'PEN', 'ARS', 'BRL', 'CLP'],
  manual: [],
}

/** ¿La pasarela acepta la moneda? `manual` (transferencia/contraentrega) acepta cualquiera. */
export function providerSupportsCurrency(provider: string, currency: string): boolean {
  if (provider === 'manual') return true
  return (PROVIDER_CURRENCIES[provider] ?? []).includes(currency.toUpperCase())
}

/**
 * Reglas de multimoneda sobre el conjunto de mercados (complementa
 * `validateMarkets`). Un mercado activo en otra moneda necesita tasa o lista de
 * precios, y que la pasarela activa acepte su moneda.
 */
export function validateMarketCurrencies(
  markets: Array<{ name: string; key: string; active: boolean } & Partial<MarketPricing> & { currency: string }>,
  opts: { baseCurrency: string; activePaymentProvider: string | null; /** false: solo valida redondeo e impuesto. */ currencies?: boolean },
): string[] {
  const errors: string[] = []
  for (const m of markets) {
    const label = m.name || m.key
    if (m.price_rounding != null && !isPriceRounding(m.price_rounding)) errors.push(`${label}: regla de redondeo inválida.`)
    const rate = Number(m.tax_rate ?? 0)
    if (!Number.isFinite(rate) || rate < 0 || rate > 50) errors.push(`${label}: el impuesto debe estar entre 0 y 50 %.`)
    if (opts.currencies === false || !m.active || m.currency.toUpperCase() === opts.baseCurrency.toUpperCase()) continue
    if (!(Number(m.fx_rate) > 0) && !m.price_list_id) {
      errors.push(`${label}: indica la tasa de cambio desde ${opts.baseCurrency} o una lista de precios en ${m.currency}.`)
    }
    if (opts.activePaymentProvider && !providerSupportsCurrency(opts.activePaymentProvider, m.currency)) {
      errors.push(`${label}: tu pasarela de pago activa no acepta ${m.currency}. Activa una que la acepte o desactiva el mercado.`)
    }
  }
  return [...new Set(errors)]
}
