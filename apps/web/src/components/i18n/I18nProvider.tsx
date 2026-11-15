'use client'

/**
 * Idioma de la interfaz en componentes de cliente (E28 · HU-465).
 * El root layout fija el locale de la petición; los componentes usan `useT()`
 * y `useFormat()`. Los catálogos viven en `@merkiai/i18n` (cascada regional).
 */
import { createContext, useContext, useMemo } from 'react'
import { createTranslator, formatMoney, formatDate, DEFAULT_LOCALE, type Translator, type MoneyOptions, type DateOptions } from '@merkiai/i18n'

const LocaleContext = createContext<string>(DEFAULT_LOCALE)

export function I18nProvider({ locale, children }: { locale: string; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
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
  return useMemo(() => ({
    money: (n: number | null | undefined, opts: MoneyOptions = {}) => formatMoney(n, { locale, ...opts }),
    date: (v: Parameters<typeof formatDate>[0], opts: DateOptions = {}) => formatDate(v, { locale, ...opts }),
  }), [locale])
}
