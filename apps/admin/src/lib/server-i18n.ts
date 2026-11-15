/**
 * Mensajes del servidor en el idioma del panel (E28 · HU-466 F6).
 * Traduce `error`/`message`/`errors`… de respuestas de API y server actions con
 * el diccionario de frases. Fail-safe: ante cualquier problema (o en tests)
 * devuelve el cuerpo original en español.
 */
import { hasMessages, localizeMessages } from '@merkiai/i18n'

export async function localizeForPanel<T>(body: T): Promise<T> {
  if (process.env.NODE_ENV === 'test' || !hasMessages(body)) return body
  try {
    const { getAdminLocale } = await import('./ui-locale')
    return localizeMessages(body, await getAdminLocale())
  } catch {
    return body
  }
}
