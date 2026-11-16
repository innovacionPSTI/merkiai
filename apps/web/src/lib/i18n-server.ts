/**
 * Traducción en Server Components (E28 · HU-465): mismo catálogo y cascada que
 * `useT()` en el cliente, con el locale de la petición.
 */
import { createTranslator, formatMoney, type Translator, type MoneyOptions } from '@merkiai/i18n'
import { getPageLang } from './request-locale'
import { getRequestCurrency } from './request-pricing'

export async function getT(namespace?: string): Promise<Translator> {
  return createTranslator(await getPageLang().catch(() => 'es-CO'), namespace)
}

/** Formateador de montos de la página: locale y moneda del mercado (HU-467); el dato puede fijar otra. */
export async function getMoneyFormatter() {
  const locale = await getPageLang().catch(() => 'es-CO')
  const currency = await getRequestCurrency().catch(() => 'COP')
  return (n: number | null | undefined, opts: MoneyOptions = {}) => formatMoney(n, { locale, currency, ...opts })
}
