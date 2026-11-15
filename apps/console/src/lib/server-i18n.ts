/**
 * Mensajes del servidor en el idioma de la consola (E28 · HU-466 F6).
 * Traduce `error`/`message`/`errors`… de las server actions. Fail-safe: ante
 * cualquier problema (o en tests) devuelve el cuerpo original en español.
 */
import { hasMessages, localizeMessages } from '@merkiai/i18n'

export async function localizeForPanel<T>(body: T): Promise<T> {
  if (process.env.NODE_ENV === 'test' || !hasMessages(body)) return body
  try {
    const { getConsoleLocale } = await import('./ui-locale')
    return localizeMessages(body, await getConsoleLocale())
  } catch {
    return body
  }
}
