import { formatMoney, formatMoneyCents, formatNumber, formatPercent, formatDate, formatDateTime, formatRelative } from '../format'

const nb = (s: string) => s.replace(/[  ]/g, ' ')
const legacyCop = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

describe('AC-4 · formatMoney', () => {
  it('por defecto es idéntico al formato histórico (es-CO, COP, sin decimales)', () => {
    for (const n of [0, 1500, 120000, 1234567.89, -45000]) expect(formatMoney(n)).toBe(legacyCop(n))
  })

  it('COP en en-US: código + separadores ingleses; en es-CO: $ y punto de miles', () => {
    expect(nb(formatMoney(120000, { currency: 'COP', locale: 'en-US' }))).toBe('COP 120,000')
    expect(nb(formatMoney(120000, { currency: 'COP', locale: 'es-CO' }))).toBe('$ 120.000')
  })

  it('monedas con decimales: MXN, EUR, USD', () => {
    expect(nb(formatMoney(1499.5, { currency: 'MXN', locale: 'es-MX' }))).toBe('$1,499.50')
    expect(nb(formatMoney(1499.5, { currency: 'EUR', locale: 'es-ES' }))).toBe('1499,50 €')
    expect(nb(formatMoney(1499.5, { currency: 'USD', locale: 'en-US' }))).toBe('$1,499.50')
  })

  it('centavos, nulos y display por código', () => {
    expect(formatMoneyCents(12000000)).toBe(legacyCop(120000))
    expect(formatMoney(null)).toBe(legacyCop(0))
    expect(nb(formatMoney(5000, { display: 'code' }))).toContain('COP')
  })
})

describe('AC-5 · la moneda nunca sale del locale', () => {
  it('un monto sin moneda explícita siempre es COP, aunque el locale sea es-MX', () => {
    expect(nb(formatMoney(100, { locale: 'es-MX' }))).toContain('COP')
  })
})

describe('números y fechas', () => {
  it('formatNumber equivale a Intl con el locale por defecto', () => {
    expect(formatNumber(1234.5678, { maximumFractionDigits: 3 })).toBe(new Intl.NumberFormat('es-CO', { maximumFractionDigits: 3 }).format(1234.5678))
    expect(formatNumber(1200, { locale: 'en-US' })).toBe('1,200')
    expect(nb(formatPercent(19))).toMatch(/^19 ?%$/)
  })

  it('formatDate equivale a toLocaleDateString (sin y con opciones)', () => {
    const d = '2026-11-15T15:30:00Z'
    expect(formatDate(d)).toBe(new Date(d).toLocaleDateString('es-CO'))
    const o = { day: 'numeric', month: 'long', year: 'numeric' } as const
    expect(formatDate(d, o)).toBe(new Date(d).toLocaleDateString('es-CO', o))
    expect(formatDate(d, { dateStyle: 'medium', timeZone: 'America/Bogota' })).toBe(new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeZone: 'America/Bogota' }).format(new Date(d)))
  })

  it('formatDateTime equivale a toLocaleString; inválidas → fallback', () => {
    const d = '2026-11-15T15:30:00Z'
    expect(formatDateTime(d)).toBe(new Date(d).toLocaleString('es-CO'))
    expect(formatDate('no-es-fecha')).toBe('—')
    expect(formatDate(null, { fallback: '' })).toBe('')
  })

  it('formatRelative', () => {
    const now = '2026-11-15T12:00:00Z'
    expect(formatRelative('2026-11-12T12:00:00Z', { now, locale: 'es-CO' })).toBe('hace 3 días')
    expect(formatRelative('2026-11-15T14:00:00Z', { now, locale: 'en-US' })).toBe('in 2 hours')
  })
})
