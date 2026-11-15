/**
 * Traducción en Server Components (E28 · HU-465): mismo catálogo y cascada que
 * `useT()` en el cliente, con el locale de la petición.
 */
import { createTranslator, formatMoney, type Translator, type MoneyOptions } from '@merkiai/i18n'
import { getPageLang } from './request-locale'

export async function getT(namespace?: string): Promise<Translator> {
  return createTranslator(await getPageLang().catch(() => 'es-CO'), namespace)
}

export async function getMoneyFormatter() {
  const locale = await getPageLang().catch(() => 'es-CO')
  return (n: number | null | undefined, opts: MoneyOptions = {}) => formatMoney(n, { locale, ...opts })
}
