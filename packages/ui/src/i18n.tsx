'use client'

/**
 * Idioma de la interfaz en componentes de cliente (E28 · HU-465/466), compartido por web, admin y consola.
 * El root layout fija el locale de la petición; los componentes usan `useT()`
 * y `useFormat()`. Los catálogos viven en `@merkiai/i18n` (cascada regional).
 */
import { createContext, useContext, useMemo } from 'react'
import { createTranslator, translatePhrase, formatMoney, formatDate, DEFAULT_LOCALE, type Translator, type MoneyOptions, type DateOptions, type MessageValues } from '@merkiai/i18n'

const LocaleContext = createContext<string>(DEFAULT_LOCALE)
/** HU-467 · moneda en que se muestran los precios de la página (la del mercado). */
const CurrencyContext = createContext<string | undefined>(undefined)

export function I18nProvider({ locale, currency, children }: { locale: string; currency?: string; children: React.ReactNode }) {
  return (
    <LocaleContext.Provider value={locale}>
      <CurrencyContext.Provider value={currency}>{children}</CurrencyContext.Provider>
    </LocaleContext.Provider>
  )
}

/** Moneda de los precios de la página (por defecto, la de `formatMoney`: COP). */
export function useCurrency(): string {
  return useContext(CurrencyContext) ?? 'COP'
}

export function useLocale(): string {
  return useContext(LocaleContext)
}

/** Traductor del locale actual, opcionalmente acotado a un namespace (`useT('web.cart')`). */
export function useT(namespace?: string): Translator {
  const locale = useLocale()
  return useMemo(() => createTranslator(locale, namespace), [locale, namespace])
}

/** Formateadores ligados al locale actual (la moneda sigue viniendo del dato). */
export function useFormat() {
  const locale = useLocale()
  const currency = useContext(CurrencyContext)
  return useMemo(() => ({
    // HU-467 · la moneda por defecto es la del mercado de la página; un dato con
    // moneda propia (pedido, documento) la indica en `opts.currency`.
    money: (n: number | null | undefined, opts: MoneyOptions = {}) => formatMoney(n, { locale, ...(currency ? { currency } : {}), ...opts }),
    date: (v: Parameters<typeof formatDate>[0], opts: DateOptions = {}) => formatDate(v, { locale, ...opts }),
  }), [locale, currency])
}

/**
 * Frase de la interfaz con clave = texto en español (estilo gettext, HU-466):
 * `<T>Guardar cambios</T>`. Úsalo en textos de JSX; para atributos, `useTx()`.
 */
export function T({ children, values }: { children: string; values?: MessageValues }) {
  const locale = useLocale()
  return <>{translatePhrase(String(children ?? ''), locale, values)}</>
}

/** Traductor de frases (clave = texto en español) para atributos y strings. */
export function useTx() {
  const locale = useLocale()
  return useMemo(() => (text: string, values?: MessageValues) => translatePhrase(text, locale, values), [locale])
}
