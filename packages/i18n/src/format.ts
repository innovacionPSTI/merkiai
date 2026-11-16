import { DEFAULT_LOCALE } from './locales'

/**
 * Formateadores únicos de la plataforma (HU-460 AC-4/AC-5 · ADR-011 §2.4).
 *
 * Reglas:
 *  - La MONEDA viene siempre del dato (pedido, lista de precios, documento):
 *    nunca se infiere del locale. Default `COP` = comportamiento histórico.
 *  - El locale por defecto es `es-CO`, así reemplazar un `Intl.NumberFormat('es-CO', …)`
 *    suelto por estas funciones no cambia la salida.
 *  - Instancias `Intl` cacheadas por clave (crearlas es caro en listas largas).
 */

export type DateInput = Date | string | number

/** Monedas que se muestran sin decimales por convención comercial. */
const ZERO_DECIMAL_DISPLAY = new Set(['COP', 'CLP', 'PYG', 'JPY', 'KRW', 'VND', 'ISK', 'HUF'])

/** Decimales con que se muestran y redondean los montos de una moneda (COP → 0, USD → 2). */
export function currencyDecimals(currency: string | null | undefined): number {
  return ZERO_DECIMAL_DISPLAY.has(String(currency || 'COP').toUpperCase()) ? 0 : 2
}

const numberCache = new Map<string, Intl.NumberFormat>()
function numberFormat(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale}|${JSON.stringify(options)}`
  let f = numberCache.get(key)
  if (!f) {
    f = new Intl.NumberFormat(locale, options)
    if (numberCache.size > 500) numberCache.clear()
    numberCache.set(key, f)
  }
  return f
}

export interface MoneyOptions {
  /** ISO 4217. Default `COP`. */
  currency?: string
  locale?: string
  /** Decimales a mostrar (default: 0 para COP y monedas sin decimales; 2 para el resto). */
  fractionDigits?: number
  /** `symbol` (default), `code` (COP 120.000) o `narrowSymbol` ($120.000). */
  display?: 'symbol' | 'code' | 'narrowSymbol'
}

/** Formatea un monto en unidades mayores (pesos, no centavos). */
export function formatMoney(amount: number | null | undefined, opts: MoneyOptions = {}): string {
  const currency = (opts.currency || 'COP').toUpperCase()
  const locale = opts.locale || DEFAULT_LOCALE
  const digits = opts.fractionDigits ?? (ZERO_DECIMAL_DISPLAY.has(currency) ? 0 : 2)
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    ...(opts.display && opts.display !== 'symbol' ? { currencyDisplay: opts.display } : {}),
  }
  return numberFormat(locale, options).format(Number(amount ?? 0) || 0)
}

/** Formatea un monto expresado en centavos (unidad menor ×100). */
export function formatMoneyCents(cents: number | null | undefined, opts: MoneyOptions = {}): string {
  return formatMoney((Number(cents ?? 0) || 0) / 100, opts)
}

export interface NumberOptions extends Intl.NumberFormatOptions {
  locale?: string
}

export function formatNumber(value: number | null | undefined, opts: NumberOptions = {}): string {
  const { locale, ...options } = opts
  return numberFormat(locale || DEFAULT_LOCALE, options).format(Number(value ?? 0) || 0)
}

/** Porcentaje a partir de un valor en puntos (`19` → `19 %`). */
export function formatPercent(points: number | null | undefined, opts: NumberOptions = {}): string {
  const { locale, maximumFractionDigits = 2, ...rest } = opts
  return numberFormat(locale || DEFAULT_LOCALE, { style: 'percent', maximumFractionDigits, ...rest }).format((Number(points ?? 0) || 0) / 100)
}

function toDate(value: DateInput): Date | null {
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

const DATE_FIELDS = ['year', 'month', 'day', 'weekday', 'era', 'dateStyle'] as const
const TIME_FIELDS = ['hour', 'minute', 'second', 'dayPeriod', 'timeStyle', 'fractionalSecondDigits'] as const

export interface DateOptions extends Intl.DateTimeFormatOptions {
  locale?: string
  /** Texto si la fecha es inválida o vacía (default `—`). */
  fallback?: string
}

/**
 * Fecha (equivale a `toLocaleDateString`): sin campos explícitos usa día/mes/año
 * numéricos. Acepta `dateStyle` y cualquier opción de `Intl.DateTimeFormat`.
 */
export function formatDate(value: DateInput | null | undefined, opts: DateOptions = {}): string {
  const { locale, fallback = '—', ...options } = opts
  const d = value === null || value === undefined || value === '' ? null : toDate(value)
  if (!d) return fallback
  const hasDate = DATE_FIELDS.some((k) => k in options)
  const hasTime = TIME_FIELDS.some((k) => k in options)
  const o: Intl.DateTimeFormatOptions = hasDate || hasTime ? options : { ...options, year: 'numeric', month: 'numeric', day: 'numeric' }
  return d.toLocaleDateString(locale || DEFAULT_LOCALE, o)
}

/**
 * Fecha y hora (equivale a `toLocaleString`): sin campos explícitos muestra
 * fecha numérica + hora con segundos.
 */
export function formatDateTime(value: DateInput | null | undefined, opts: DateOptions = {}): string {
  const { locale, fallback = '—', ...options } = opts
  const d = value === null || value === undefined || value === '' ? null : toDate(value)
  if (!d) return fallback
  return d.toLocaleString(locale || DEFAULT_LOCALE, options)
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
  ['second', 1],
]

/** Tiempo relativo: «hace 3 días», «in 2 hours». */
export function formatRelative(value: DateInput, opts: { locale?: string; now?: DateInput } = {}): string {
  const d = toDate(value)
  if (!d) return '—'
  const now = toDate(opts.now ?? Date.now()) ?? new Date()
  const diff = Math.round((d.getTime() - now.getTime()) / 1000)
  const rtf = new Intl.RelativeTimeFormat(opts.locale || DEFAULT_LOCALE, { numeric: 'auto' })
  for (const [unit, secs] of RELATIVE_UNITS) {
    if (Math.abs(diff) >= secs || unit === 'second') return rtf.format(Math.round(diff / secs), unit)
  }
  return rtf.format(0, 'second')
}
