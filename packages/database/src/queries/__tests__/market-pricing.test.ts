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
