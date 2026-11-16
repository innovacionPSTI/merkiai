import {
  roundPrice, convertFromBase, marketPrice, computeTax, providerSupportsCurrency, validateMarketCurrencies,
} from '../market-pricing'
import { validateMarkets, normalizeMarketInput, DEFAULT_MARKET, type Market } from '../markets'

const usd = { currency: 'USD', fx_rate: 0.00025, price_rounding: 'x99' as const }

describe('HU-467 · redondeo', () => {
  it('auto usa los decimales de la moneda', () => {
    expect(roundPrice(1234.567, 'COP')).toBe(1235)
    expect(roundPrice(12.345, 'USD')).toBe(12.35)
  })
  it('terminaciones comerciales y múltiplos', () => {
    expect(roundPrice(12.3, 'USD', 'x99')).toBe(12.99)
    expect(roundPrice(12.995, 'USD', 'x99')).toBe(13.99)
    expect(roundPrice(12.3, 'USD', 'x90')).toBe(12.9)
    expect(roundPrice(1249, 'MXN', 'nearest_10')).toBe(1250)
    expect(roundPrice(118_450, 'COP', 'nearest_1000')).toBe(118_000)
    expect(roundPrice(1234.4, 'COP', 'x99')).toBe(1234)
  })
})

describe('HU-467 · AC-1 precio local', () => {
  it('misma moneda → precio base intacto; sin tasa → null', () => {
    expect(convertFromBase(120_000, { currency: 'COP', fx_rate: null, price_rounding: 'auto' }, 'COP')).toBe(120_000)
    expect(convertFromBase(120_000, { currency: 'USD', fx_rate: null, price_rounding: 'auto' }, 'COP')).toBeNull()
  })
  it('convierte con tasa fija y redondeo', () => {
    expect(convertFromBase(120_000, usd, 'COP')).toBe(30.99)
  })
  it('la lista de precios del mercado gana sobre la conversión', () => {
    expect(marketPrice({ basePrice: 120_000, listPrice: 29 }, usd, 'COP')).toBe(29)
    expect(marketPrice({ basePrice: 120_000, listPrice: null }, usd, 'COP')).toBe(30.99)
  })
})

describe('HU-467 · AC-4 impuesto por país', () => {
  it('incluido: se discrimina sin cambiar el total', () => {
    expect(computeTax(119_000, { tax_rate: 19, tax_included: true, currency: 'COP' })).toEqual({ tax: 19_000, total: 119_000 })
  })
  it('no incluido: se suma (con los decimales de la moneda)', () => {
    expect(computeTax(100, { tax_rate: 16, tax_included: false, currency: 'MXN' })).toEqual({ tax: 16, total: 116 })
    expect(computeTax(10.5, { tax_rate: 21, tax_included: false, currency: 'EUR' })).toEqual({ tax: 2.21, total: 12.71 })
  })
  it('sin tasa no hay impuesto', () => {
    expect(computeTax(5000, { tax_rate: 0, tax_included: true, currency: 'COP' })).toEqual({ tax: 0, total: 5000 })
  })
})

describe('HU-467 · AC-3 pasarela compatible', () => {
  it('las pasarelas colombianas solo aceptan COP', () => {
    expect(providerSupportsCurrency('wompi', 'COP')).toBe(true)
    expect(providerSupportsCurrency('wompi', 'USD')).toBe(false)
    expect(providerSupportsCurrency('payzen', 'usd')).toBe(true)
    expect(providerSupportsCurrency('manual', 'XYZ')).toBe(true)
  })
  it('valida tasa/lista y pasarela del mercado en otra moneda', () => {
    const errs = validateMarketCurrencies(
      [{ name: 'Estados Unidos', key: 'us', active: true, currency: 'USD', fx_rate: null, price_list_id: null }],
      { baseCurrency: 'COP', activePaymentProvider: 'wompi' },
    )
    expect(errs).toHaveLength(2)
    expect(validateMarketCurrencies(
      [{ name: 'Estados Unidos', key: 'us', active: true, currency: 'USD', fx_rate: 0.00025 }],
      { baseCurrency: 'COP', activePaymentProvider: 'payzen' },
    )).toEqual([])
  })
})

describe('HU-467 · mercados', () => {
  const base: Market = { ...DEFAULT_MARKET, id: 1, virtual: false }
  const us = { ...base, id: 2, key: 'us', name: 'Estados Unidos', countries: ['US'], currency: 'USD', locales: ['en-US' as const], default_locale: 'en-US' as const, is_default: false, fx_rate: 0.00025 }
  const rules = { maxLanguages: null, marketsEnabled: true, baseCurrency: 'COP', activePaymentProvider: 'payzen' }

  it('sin la feature multi_currency otra moneda se rechaza', () => {
    expect(validateMarkets([base, us], { ...rules, multiCurrency: false }).join(' ')).toContain('multimoneda')
  })
  it('con la feature, un mercado USD con tasa y pasarela compatible es válido', () => {
    expect(validateMarkets([base, us], { ...rules, multiCurrency: true })).toEqual([])
    expect(validateMarkets([base, us], { ...rules, multiCurrency: true, activePaymentProvider: 'bold' }).join(' ')).toContain('no acepta USD')
  })
  it('normaliza tasa, impuesto y redondeo del formulario', () => {
    const n = normalizeMarketInput({ name: 'X', locales: ['es-MX'], default_locale: 'es-MX', fx_rate: '0,0042', tax_rate: '16', price_rounding: 'raro', tax_included: false })
    expect(n.fx_rate).toBe(0.0042)
    expect(n.tax_rate).toBe(16)
    expect(n.price_rounding).toBe('auto')
    expect(n.tax_included).toBe(false)
  })
})

describe('HU-467 F2 · contexto de la visita', () => {
  const { resolveMarket, priceIn, localizeProductPrices, couponForCurrency, promotionsForCurrency, storedValueUsable, basePricingContext } =
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('../market-pricing')
  const co = { key: 'co', name: 'Colombia', currency: 'COP', fx_rate: null, price_rounding: 'auto', tax_rate: 19, tax_included: true, price_list_id: null, locales: ['es-CO'], default_locale: 'es-CO', domain: null, is_default: true, active: true }
  const us = { key: 'us', name: 'Estados Unidos', currency: 'USD', fx_rate: 0.00025, price_rounding: 'x99', tax_rate: 0, tax_included: false, price_list_id: 5, locales: ['en-US', 'es-CO'], default_locale: 'en-US', domain: 'tienda.us', is_default: false, active: true }
  const ctx = { market: us, baseCurrency: 'COP', currency: 'USD', converting: true, listPrices: new Map([['v:11', 25], ['p:2', 40]]) }

  it('mercado por dominio, luego por idioma (prefiere el por defecto), luego el por defecto', () => {
    expect(resolveMarket([co, us], { host: 'www.tienda.us' }).key).toBe('us')
    expect(resolveMarket([co, us], { locale: 'en-US' }).key).toBe('us')
    expect(resolveMarket([co, us], { locale: 'es-CO' }).key).toBe('co')
    expect(resolveMarket([co, us], { locale: 'es-ES' }).key).toBe('co')
  })

  it('precio: lista por variante → por producto → conversión; sin conversión = base', () => {
    expect(priceIn(ctx, { basePrice: 120_000, variantId: 11, productId: 1 })).toBe(25)
    expect(priceIn(ctx, { basePrice: 120_000, variantId: 12, productId: 2 })).toBe(40)
    expect(priceIn(ctx, { basePrice: 120_000, variantId: 13, productId: 3 })).toBe(30.99)
    expect(priceIn(basePricingContext('COP'), { basePrice: 120_000 })).toBe(120_000)
  })

  it('filas de catálogo: variantes, min/max, precio tachado y moneda; sin precio → se omite', () => {
    const rows = [{ id: 1, min_price: 120_000, max_price: 160_000, variants: [{ id: 11, price: 120_000, compare_at_price: 140_000 }, { id: 14, price: 160_000, compare_at_price: null }] }]
    const [r] = localizeProductPrices(rows, ctx)
    expect(r.currency).toBe('USD')
    expect(r.variants.map((v: { price: number }) => v.price)).toEqual([25, 40.99])
    expect(r.variants[0].compare_at_price).toBe(35.99)
    expect([r.min_price, r.max_price]).toEqual([25, 40.99])
    const noRate = { ...ctx, market: { ...us, fx_rate: null }, listPrices: new Map() }
    expect(localizeProductPrices([{ id: 9, min_price: 1000 }], noRate)).toEqual([])
  })

  it('AC-6 · cupón fijo solo en su moneda; porcentual con mínimo convertido; gift card/saldo por moneda', () => {
    expect(couponForCurrency({ type: 'fixed', currency: null, min_order_amount: 0 }, ctx)).toBeNull()
    expect(couponForCurrency({ type: 'fixed', currency: 'USD', min_order_amount: 10 }, ctx)?.min_order_amount).toBe(10)
    expect(couponForCurrency({ type: 'percentage', currency: null, min_order_amount: 100_000 }, ctx)?.min_order_amount).toBe(25.99)
    expect(storedValueUsable(null, ctx)).toBe(false)
    expect(storedValueUsable('usd', ctx)).toBe(true)
  })

  it('promociones: en otra moneda se omiten las de monto fijo y se convierte el mínimo', () => {
    const promos = [{ type: 'cart_fixed', config: { amount: 10_000 } }, { type: 'cart_percent', config: { percent: 10, min_subtotal: 200_000 } }]
    const out = promotionsForCurrency(promos, ctx)
    expect(out).toHaveLength(1)
    expect(out[0].config.min_subtotal).toBe(50.99)
    expect(promotionsForCurrency(promos, basePricingContext())).toBe(promos)
  })
})
