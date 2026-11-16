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

// ── Contexto de precios de una petición (storefront / checkout) ────────────────

/** Mercado mínimo para resolver precios (subconjunto de `Market`). */
export interface PricingMarket extends MarketPricing {
  key: string
  name: string
  locales: string[]
  default_locale: string
  domain: string | null
  is_default: boolean
  active: boolean
}

/**
 * Mercado de una visita: el del dominio, si coincide; si no, el que tiene el
 * locale como idioma por defecto o habilitado (con preferencia por el mercado
 * por defecto); si nada coincide, el mercado por defecto. Pura.
 */
export function resolveMarket<M extends PricingMarket>(markets: M[], opts: { locale?: string | null; host?: string | null }): M | null {
  const active = markets.filter((m) => m.active)
  if (active.length === 0) return markets[0] ?? null
  const def = active.find((m) => m.is_default) ?? active[0]
  const host = String(opts.host ?? '').toLowerCase().replace(/:\d+$/, '').replace(/^www\./, '')
  if (host) {
    const byDomain = active.find((m) => m.domain && (host === m.domain || host === `www.${m.domain}`))
    if (byDomain) return byDomain
  }
  const locale = opts.locale ?? null
  if (locale) {
    if (def.locales.includes(locale)) return def
    const byDefault = active.find((m) => m.default_locale === locale)
    if (byDefault) return byDefault
    const byEnabled = active.find((m) => m.locales.includes(locale))
    if (byEnabled) return byEnabled
  }
  return def
}

export interface PricingContext {
  market: PricingMarket | null
  baseCurrency: string
  /** Moneda en que se muestra y se cobra. */
  currency: string
  /** true si el mercado vende en otra moneda (hay que convertir). */
  converting: boolean
  /** Precios de la lista del mercado: `v:<variantId>` y `p:<productId>`. */
  listPrices: Map<string, number>
}

/** Contexto neutro: moneda base, sin conversión (cero regresión). */
export function basePricingContext(baseCurrency = 'COP', market: PricingMarket | null = null): PricingContext {
  return { market, baseCurrency, currency: baseCurrency, converting: false, listPrices: new Map() }
}

/**
 * Precio de una variante/producto en el contexto: lista del mercado (variante →
 * producto) o conversión del precio base. Sin conversión → precio base.
 * `null` = sin precio en esa moneda (no se puede vender en el mercado).
 */
export function priceIn(ctx: PricingContext, input: { basePrice: number; variantId?: number | null; productId?: number | null }): number | null {
  if (!ctx.converting || !ctx.market) return input.basePrice
  const list = (input.variantId != null ? ctx.listPrices.get(`v:${input.variantId}`) : undefined)
    ?? (input.productId != null ? ctx.listPrices.get(`p:${input.productId}`) : undefined)
  return marketPrice({ basePrice: input.basePrice, listPrice: list ?? null }, ctx.market, ctx.baseCurrency)
}

/** Monto de la tienda (envío, mínimos) en la moneda del contexto: solo conversión. */
export function amountIn(ctx: PricingContext, baseAmount: number): number | null {
  if (!ctx.converting || !ctx.market) return baseAmount
  return convertFromBase(baseAmount, ctx.market, ctx.baseCurrency)
}

type PriceRow = Record<string, unknown>

/**
 * Convierte los precios de filas de producto del catálogo (lista, ficha,
 * carrusel): `variants[].price`/`compare_at_price`, `min_price`/`max_price`,
 * `price`/`compare_at_price` planos y `price_delta` de modificadores. Los
 * productos sin precio en la moneda del mercado se omiten. Sin conversión → igual.
 */
export function localizeProductPrices<T>(rows: T[], ctx: PricingContext): T[] {
  if (!ctx.converting || !ctx.market) return rows
  const out: T[] = []
  for (const row of rows) {
    const r = convertProductRow(row as unknown as PriceRow, ctx)
    if (r) out.push(r as unknown as T)
  }
  return out
}

function convertProductRow(row: PriceRow, ctx: PricingContext): PriceRow | null {
  const productId = typeof row.id === 'number' ? row.id : Number(row.product_id ?? NaN)
  const next: PriceRow = { ...row, currency: ctx.currency }
  const conv = (v: unknown, variantId?: number | null): number | null =>
    typeof v === 'number' || (typeof v === 'string' && v !== '' && Number.isFinite(Number(v)))
      ? priceIn(ctx, { basePrice: Number(v), variantId: variantId ?? null, productId: Number.isFinite(productId) ? productId : null })
      : null
  const fx = (v: unknown): number | null => (v == null ? null : amountIn(ctx, Number(v)))

  if (Array.isArray(row.variants)) {
    const variants = (row.variants as PriceRow[]).map((v): PriceRow | null => {
      const price = conv(v.price, typeof v.id === 'number' ? v.id : null)
      return price == null ? null : { ...v, price, compare_at_price: fx(v.compare_at_price) }
    })
    const priced = variants.filter((v): v is PriceRow => v !== null)
    if (priced.length === 0 && variants.length > 0) return null
    next.variants = priced
    const prices = priced.map((v) => Number(v.price))
    if ('min_price' in row) next.min_price = prices.length ? Math.min(...prices) : null
    if ('max_price' in row) next.max_price = prices.length ? Math.max(...prices) : null
  } else {
    if ('min_price' in row && row.min_price != null) { const p = conv(row.min_price); if (p == null) return null; next.min_price = p }
    if ('max_price' in row && row.max_price != null) next.max_price = conv(row.max_price) ?? next.min_price
  }
  if ('price' in row && row.price != null) { const p = conv(row.price, typeof row.variant_id === 'number' ? row.variant_id : null); if (p == null) return null; next.price = p }
  if ('compare_at_price' in row && !Array.isArray(row.variants)) next.compare_at_price = fx(row.compare_at_price)
  if (Array.isArray(row.modifier_groups)) {
    next.modifier_groups = (row.modifier_groups as PriceRow[]).map((g) => ({
      ...g,
      options: Array.isArray(g.options) ? (g.options as PriceRow[]).map((o) => ({ ...o, price_delta: fx(o.price_delta) ?? 0 })) : g.options,
    }))
  }
  return next
}

/**
 * Cupones, gift cards y saldo solo se aplican en su moneda (AC-6). `null` en el
 * dato = moneda base de la tienda. Los cupones porcentuales valen en cualquiera.
 */
export function storedValueUsable(valueCurrency: string | null | undefined, ctx: Pick<PricingContext, 'currency' | 'baseCurrency'>): boolean {
  return String(valueCurrency || ctx.baseCurrency).toUpperCase() === ctx.currency.toUpperCase()
}

/**
 * Promociones aplicables en la moneda del contexto: las de monto fijo están en la
 * moneda base (no aplican en otra); los mínimos de compra se convierten. Pura.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function promotionsForCurrency<P extends { type: string; config?: any }>(promos: P[], ctx: PricingContext): P[] {
  if (!ctx.converting) return promos
  return promos
    .filter((p) => p.type !== 'cart_fixed')
    .map((p) => {
      const min = p.config?.min_subtotal
      if (min == null) return p
      const converted = amountIn(ctx, Number(min))
      return converted == null ? null : { ...p, config: { ...p.config, min_subtotal: converted } }
    })
    .filter((p): p is P => p !== null)
}

/**
 * Cupón en la moneda del contexto (AC-6): el de monto fijo solo vale en su
 * moneda; el porcentual vale en cualquiera, con el mínimo de compra convertido
 * si está en la moneda base. `null` = no aplica en esta moneda. Pura.
 */
export function couponForCurrency<C extends { type: string; currency?: string | null; min_order_amount: number }>(coupon: C, ctx: PricingContext): C | null {
  const own = String(coupon.currency || ctx.baseCurrency).toUpperCase()
  if (own === ctx.currency.toUpperCase()) return coupon
  if (coupon.type !== 'percentage') return null
  const min = coupon.min_order_amount ? amountIn(ctx, coupon.min_order_amount) : 0
  return min == null ? null : { ...coupon, min_order_amount: min }
}

// ── Totales por moneda (AC-5): nunca se suman montos de monedas distintas ──────

export interface CurrencyAmount { currency: string; amount: number }

/**
 * Agrupa montos por moneda (la moneda base primero, luego por monto). Filas sin
 * moneda cuentan en la base (pedidos anteriores a la multimoneda). Pura.
 */
export function sumByCurrency<T>(rows: T[], pick: (row: T) => { amount: number | null | undefined; currency?: string | null }, baseCurrency = 'COP'): CurrencyAmount[] {
  const map = new Map<string, number>()
  for (const r of rows) {
    const { amount, currency } = pick(r)
    const c = String(currency || baseCurrency).toUpperCase()
    map.set(c, (map.get(c) ?? 0) + (Number(amount) || 0))
  }
  const base = baseCurrency.toUpperCase()
  return [...map.entries()]
    .map(([currency, amount]) => ({ currency, amount }))
    .sort((a, b) => (a.currency === base ? -1 : b.currency === base ? 1 : b.amount - a.amount))
}
