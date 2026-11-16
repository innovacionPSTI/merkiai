/**
 * queries/markets.ts — Idiomas y mercados por tienda (E28 · HU-461 · ADR-011).
 *
 * Mercado = países + moneda + lista de precios (opcional) + locales habilitados +
 * locale por defecto + dominio (opcional). Exactamente un mercado por defecto por
 * tienda; su locale por defecto es el de la tienda.
 *
 * La validación es PURA (`validateMarkets`) y se aplica sobre el conjunto
 * resultante completo, así las reglas globales (un solo default, límite de
 * idiomas del plan, mercados habilitados) no dependen del orden de las
 * operaciones. Sin filas, la tienda tiene el mercado virtual "Colombia"
 * (es-CO, COP): cero regresión (AC-1).
 */
import { SUPPORTED_LOCALES, SUPPORTED_COUNTRIES, normalizeLocale, DEFAULT_LOCALE, type Locale, type CountryCode } from '@merkiai/i18n'
import type { Db } from '../client'
import { isPriceRounding, validateMarketCurrencies, resolveMarket, basePricingContext, type PriceRounding, type PricingContext } from './market-pricing'

export interface Market {
  id: number
  key: string
  name: string
  countries: string[]
  currency: string
  price_list_id: number | null
  locales: Locale[]
  default_locale: Locale
  domain: string | null
  is_default: boolean
  active: boolean
  /** HU-467 · tasa fija desde la moneda base (NULL = sin conversión). */
  fx_rate: number | null
  /** HU-467 · redondeo del precio convertido. */
  price_rounding: PriceRounding
  /** HU-467 · impuesto del país en % (0 = no se discrimina). */
  tax_rate: number
  /** HU-467 · los precios incluyen el impuesto. */
  tax_included: boolean
  /** true si es el mercado por defecto implícito (aún no guardado en BD). */
  virtual?: boolean
}

export interface MarketInput {
  id?: number | null
  key?: string | null
  name: string
  countries?: string[] | null
  currency?: string | null
  price_list_id?: number | null
  locales: string[]
  default_locale: string
  domain?: string | null
  is_default?: boolean
  active?: boolean
  fx_rate?: number | string | null
  price_rounding?: string | null
  tax_rate?: number | string | null
  tax_included?: boolean | null
}

export interface MarketRules {
  /** Límite `max_idiomas` del plan (null = ilimitado). */
  maxLanguages: number | null
  /** Feature `markets`: más de un mercado. */
  marketsEnabled: boolean
  /** Moneda base de la tienda (la del mercado por defecto). */
  baseCurrency: string
  /** HU-467 · feature `multi_currency` del plan. Sin ella, todo mercado usa la moneda base. */
  multiCurrency?: boolean
  /** HU-467 · pasarela de pago activa (para validar que acepte la moneda del mercado). */
  activePaymentProvider?: string | null
}

/** Valor por defecto de `multiCurrency` cuando el llamador no lo indica (lo decide el plan). */
export const MULTI_CURRENCY_ENABLED = false

export const DEFAULT_MARKET: Market = {
  id: 0,
  key: 'colombia',
  name: 'Colombia',
  countries: ['CO'],
  currency: 'COP',
  price_list_id: null,
  locales: [DEFAULT_LOCALE],
  default_locale: DEFAULT_LOCALE,
  domain: null,
  is_default: true,
  active: true,
  fx_rate: null,
  price_rounding: 'auto',
  tax_rate: 0,
  tax_included: true,
  virtual: true,
}

/** `"Estados Unidos"` → `estados-unidos` (clave estable del mercado). */
export function marketKeyFromName(name: string): string {
  return String(name ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 32) || 'mercado'
}

function normalizeDomain(raw: string | null | undefined): string | null {
  const d = String(raw ?? '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
  return d || null
}

/** Normaliza la entrada del formulario (mayúsculas, locales canónicos, sin duplicados). */
function toNumberOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = Number(String(v).replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

export function normalizeMarketInput(input: MarketInput): MarketInput & { key: string; countries: string[]; currency: string; locales: string[]; domain: string | null; fx_rate: number | null; price_rounding: PriceRounding; tax_rate: number; tax_included: boolean } {
  const locales = [...new Set((input.locales ?? []).map((l) => normalizeLocale(l) ?? String(l).trim()))].filter(Boolean)
  return {
    ...input,
    name: String(input.name ?? '').trim(),
    key: (input.key ? String(input.key).trim().toLowerCase() : '') || marketKeyFromName(input.name),
    countries: [...new Set((input.countries ?? []).map((c) => String(c).trim().toUpperCase()).filter(Boolean))],
    currency: String(input.currency ?? '').trim().toUpperCase(),
    locales,
    default_locale: normalizeLocale(input.default_locale) ?? String(input.default_locale ?? '').trim(),
    domain: normalizeDomain(input.domain),
    is_default: Boolean(input.is_default),
    active: input.active ?? true,
    fx_rate: toNumberOrNull(input.fx_rate),
    price_rounding: isPriceRounding(input.price_rounding) ? input.price_rounding : 'auto',
    tax_rate: toNumberOrNull(input.tax_rate) ?? 0,
    tax_included: input.tax_included ?? true,
  }
}

/** Locales publicables de la tienda: unión de los mercados activos (sin duplicados). */
export function enabledLocales(markets: Pick<Market, 'locales' | 'active'>[]): Locale[] {
  const out: Locale[] = []
  for (const m of markets) if (m.active) for (const l of m.locales) if (!out.includes(l)) out.push(l)
  return out
}

/**
 * Países a los que vende la tienda (HU-468): los de los mercados activos que la
 * plataforma soporta, con los del mercado por defecto primero. Sin datos → CO.
 */
export function marketCountries(markets: Market[]): CountryCode[] {
  const supported = SUPPORTED_COUNTRIES as readonly string[]
  const ordered = [...markets].filter((m) => m.active).sort((a, b) => Number(b.is_default) - Number(a.is_default))
  const out: CountryCode[] = []
  for (const m of ordered) for (const c of m.countries) if (supported.includes(c) && !out.includes(c as CountryCode)) out.push(c as CountryCode)
  return out.length ? out : ['CO']
}

/** Mercado por defecto (o el primero, o el virtual si no hay ninguno). */
export function defaultMarket(markets: Market[]): Market {
  return markets.find((m) => m.is_default) ?? markets[0] ?? DEFAULT_MARKET
}

/** Locale por defecto de la tienda = locale por defecto de su mercado por defecto. */
export function storeDefaultLocale(markets: Market[]): Locale {
  return defaultMarket(markets).default_locale
}

/**
 * Valida el conjunto COMPLETO de mercados resultante. Devuelve mensajes para el
 * comerciante (vacío = válido). Pura.
 */
export function validateMarkets(markets: Array<Omit<Market, 'id'> & { id?: number | null }>, rules: MarketRules): string[] {
  const errors: string[] = []
  const supported = SUPPORTED_LOCALES as readonly string[]
  if (markets.length === 0) return ['La tienda debe tener al menos un mercado.']

  const defaults = markets.filter((m) => m.is_default)
  if (defaults.length !== 1) errors.push('Debe haber exactamente un mercado por defecto.')
  else if (!defaults[0].active) errors.push('El mercado por defecto no puede estar inactivo.')

  if (!rules.marketsEnabled && markets.length > 1) {
    errors.push('Tu plan incluye un solo mercado. Mejora tu plan para vender en varios mercados.')
  }

  const keys = new Set<string>()
  const domains = new Set<string>()
  for (const m of markets) {
    const label = m.name || m.key || 'Mercado'
    if (!m.name) errors.push('Cada mercado necesita un nombre.')
    if (!/^[a-z0-9][a-z0-9-]{0,31}$/.test(m.key)) errors.push(`${label}: la clave solo admite minúsculas, números y guiones.`)
    if (keys.has(m.key)) errors.push(`Ya existe otro mercado con la clave "${m.key}".`)
    keys.add(m.key)
    if (m.locales.length === 0) errors.push(`${label}: habilita al menos un idioma.`)
    const unsupported = m.locales.filter((l) => !supported.includes(l))
    if (unsupported.length) errors.push(`${label}: idioma no soportado (${unsupported.join(', ')}).`)
    if (!m.locales.includes(m.default_locale)) errors.push(`${label}: el idioma por defecto debe estar entre los habilitados.`)
    if (!/^[A-Z]{3}$/.test(m.currency)) errors.push(`${label}: moneda inválida.`)
    else if (!(rules.multiCurrency ?? MULTI_CURRENCY_ENABLED) && m.currency !== rules.baseCurrency) {
      errors.push(`${label}: tu plan no incluye multimoneda; todos los mercados venden en la moneda de la tienda (${rules.baseCurrency}).`)
    }
    const badCountries = m.countries.filter((c) => !/^[A-Z]{2}$/.test(c))
    if (badCountries.length) errors.push(`${label}: código de país inválido (${badCountries.join(', ')}).`)
    if (m.domain) {
      if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(m.domain)) errors.push(`${label}: dominio inválido.`)
      if (domains.has(m.domain)) errors.push(`El dominio ${m.domain} ya está asignado a otro mercado.`)
      domains.add(m.domain)
    }
  }

  errors.push(...validateMarketCurrencies(markets as Market[], {
    baseCurrency: rules.baseCurrency,
    activePaymentProvider: rules.activePaymentProvider ?? null,
    currencies: rules.multiCurrency ?? MULTI_CURRENCY_ENABLED,
  }))

  const languages = enabledLocales(markets as Market[]).length
  if (rules.maxLanguages !== null && languages > rules.maxLanguages) {
    errors.push(rules.maxLanguages === 1
      ? 'Tu plan incluye un solo idioma. Mejora tu plan para publicar la tienda en más idiomas.'
      : `Tu plan permite ${rules.maxLanguages} idiomas y la configuración usa ${languages}. Mejora tu plan o quita alguno.`)
  }
  return [...new Set(errors)]
}

/**
 * Conjunto resultante de crear/editar un mercado. Si el editado pasa a ser el
 * por defecto, los demás dejan de serlo. Pura.
 */
export function applyMarketChange(existing: Market[], input: MarketInput): Array<Omit<Market, 'id'> & { id?: number | null }> {
  const n = normalizeMarketInput(input)
  const base = existing.filter((m) => !m.virtual || n.id !== m.id)
  const draft = {
    id: n.id ?? null, key: n.key, name: n.name, countries: n.countries, currency: n.currency,
    price_list_id: n.price_list_id ?? null, locales: n.locales as Locale[], default_locale: n.default_locale as Locale,
    domain: n.domain, is_default: Boolean(n.is_default), active: n.active ?? true,
    fx_rate: n.fx_rate, price_rounding: n.price_rounding, tax_rate: n.tax_rate, tax_included: n.tax_included,
  }
  const rest = base.filter((m) => !(n.id && m.id === n.id))
  const others = draft.is_default ? rest.map((m) => ({ ...m, is_default: false })) : rest
  return [...others, draft]
}

function toMarket(r: Record<string, unknown>): Market {
  return {
    id: Number(r.id),
    key: String(r.key),
    name: String(r.name),
    countries: (r.countries as string[]) ?? [],
    currency: String(r.currency ?? 'COP'),
    price_list_id: (r.price_list_id as number | null) ?? null,
    locales: ((r.locales as string[]) ?? []).map((l) => normalizeLocale(l)).filter(Boolean) as Locale[],
    default_locale: (normalizeLocale(r.default_locale as string) ?? DEFAULT_LOCALE) as Locale,
    domain: (r.domain as string | null) ?? null,
    is_default: Boolean(r.is_default),
    active: r.active !== false,
    fx_rate: r.fx_rate == null ? null : Number(r.fx_rate),
    price_rounding: isPriceRounding(r.price_rounding) ? r.price_rounding : 'auto',
    tax_rate: Number(r.tax_rate ?? 0) || 0,
    tax_included: r.tax_included !== false,
  }
}

/** Mercados de la tienda (o el mercado virtual por defecto si aún no hay ninguno). */
export async function listMarkets(db: Db, tenantId: string): Promise<Market[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (db as any).from('markets').select('*').eq('tenant_id', tenantId).order('is_default', { ascending: false }).order('name')
  if (error) throw new Error(error.message)
  const rows = ((data ?? []) as Record<string, unknown>[]).map(toMarket)
  return rows.length ? rows : [{ ...DEFAULT_MARKET }]
}

/** Locale por defecto de la tienda leído de BD (fail-safe: es-CO). Para correos sin pedido. */
export async function getStoreDefaultLocale(db: Db, tenantId: string): Promise<Locale> {
  try {
    return storeDefaultLocale(await listMarkets(db, tenantId))
  } catch {
    return DEFAULT_MARKET.default_locale
  }
}

/**
 * HU-467 · contexto de precios de una visita: mercado (por dominio o locale),
 * moneda y precios de su lista. Fail-safe: ante error, moneda base sin conversión.
 */
export async function getPricingContext(db: Db, tenantId: string, opts: { locale?: string | null; host?: string | null }): Promise<PricingContext> {
  try {
    const markets = await listMarkets(db, tenantId)
    const baseCurrency = defaultMarket(markets).currency
    const market = resolveMarket(markets, opts)
    if (!market || market.currency.toUpperCase() === baseCurrency.toUpperCase()) return basePricingContext(baseCurrency, market)
    const listPrices = new Map<string, number>()
    if (market.price_list_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (db as any).from('price_list_items').select('product_id, variant_id, price').eq('price_list_id', market.price_list_id)
      for (const r of (data ?? []) as Array<{ product_id: number | null; variant_id: number | null; price: number }>) {
        if (r.variant_id != null) listPrices.set(`v:${r.variant_id}`, Number(r.price))
        else if (r.product_id != null) listPrices.set(`p:${r.product_id}`, Number(r.price))
      }
    }
    return { market, baseCurrency, currency: market.currency.toUpperCase(), converting: true, listPrices }
  } catch {
    return basePricingContext()
  }
}

export class MarketValidationError extends Error {
  constructor(readonly errors: string[]) {
    super(errors.join(' '))
    this.name = 'MarketValidationError'
  }
}

/** Guarda la fila virtual por defecto si la tienda aún no tiene mercados en BD. */
async function materializeDefault(db: Db, tenantId: string, markets: Market[]): Promise<Market[]> {
  if (!markets.some((m) => m.virtual)) return markets
  const { virtual: _v, id: _id, ...row } = DEFAULT_MARKET
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (db as any).from('markets').insert({ ...row, tenant_id: tenantId }).select('*').single()
  if (error) throw new Error(error.message)
  return [toMarket(data as Record<string, unknown>)]
}

/**
 * Crea o edita un mercado. Valida el conjunto resultante con las reglas del plan
 * y lanza `MarketValidationError` con los mensajes si no es válido.
 */
export async function saveMarket(db: Db, tenantId: string, input: MarketInput, rules: Omit<MarketRules, 'baseCurrency'>): Promise<Market> {
  let current = await listMarkets(db, tenantId)
  const editingVirtual = current.some((m) => m.virtual) && (input.id === 0 || input.id == null) && input.is_default
  const baseCurrency = defaultMarket(current).currency
  // Editar el mercado virtual = crear la fila por defecto con esos datos.
  const next = editingVirtual
    ? applyMarketChange([], { ...input, id: null, is_default: true })
    : applyMarketChange(current, input)
  const errors = validateMarkets(next, { ...rules, baseCurrency })
  if (errors.length) throw new MarketValidationError(errors)

  if (!editingVirtual) current = await materializeDefault(db, tenantId, current)
  const n = normalizeMarketInput(input)
  const row = {
    tenant_id: tenantId, key: n.key, name: n.name, countries: n.countries, currency: n.currency,
    price_list_id: n.price_list_id ?? null, locales: n.locales, default_locale: n.default_locale,
    domain: n.domain, is_default: Boolean(n.is_default) || editingVirtual, active: n.active ?? true,
    fx_rate: n.fx_rate, price_rounding: n.price_rounding, tax_rate: n.tax_rate, tax_included: n.tax_included,
    updated_at: new Date().toISOString(),
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = (db as any).from('markets')
  if (row.is_default) {
    // Un solo default (índice único parcial): primero se libera el anterior.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const q = (db as any).from('markets').update({ is_default: false }).eq('tenant_id', tenantId).eq('is_default', true)
    const { error } = n.id ? await q.neq('id', n.id) : await q
    if (error) throw new Error(error.message)
  }
  const { data, error } = n.id && !editingVirtual
    ? await t.update(row).eq('tenant_id', tenantId).eq('id', n.id).select('*').single()
    : await t.insert(row).select('*').single()
  if (error) throw new Error(error.message)
  return toMarket(data as Record<string, unknown>)
}

/** Elimina un mercado que no sea el por defecto. */
export async function deleteMarket(db: Db, tenantId: string, id: number): Promise<void> {
  const current = await listMarkets(db, tenantId)
  const target = current.find((m) => m.id === id)
  if (!target || target.virtual) throw new MarketValidationError(['El mercado no existe.'])
  if (target.is_default) throw new MarketValidationError(['No puedes eliminar el mercado por defecto. Elige otro como predeterminado primero.'])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (db as any).from('markets').delete().eq('tenant_id', tenantId).eq('id', id)
  if (error) throw new Error(error.message)
}
