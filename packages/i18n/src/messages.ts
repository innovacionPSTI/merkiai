import { CATALOGS, type MessageTree } from './catalogs'
import { formatMessage, type MessageValues } from './icu'
import { DEFAULT_LOCALE, localeChain } from './locales'

/**
 * Resolución de mensajes en cascada (HU-460 AC-1):
 *   `es-MX` → `es` → (`es` de referencia si el idioma base es otro) → la clave.
 * Nunca devuelve texto vacío ni lanza: una clave inexistente se muestra tal cual
 * (visible en QA y detectada por `pnpm i18n:check`).
 */

export type { MessageTree } from './catalogs'
export type { MessageValues } from './icu'

const flatCache = new Map<MessageTree, Map<string, string>>()

/** Aplana `{ shop: { cart: 'Carrito' } }` → `shop.cart`. */
export function flattenMessages(tree: MessageTree, prefix = '', out = new Map<string, string>()): Map<string, string> {
  for (const [k, v] of Object.entries(tree)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (typeof v === 'string') out.set(key, v)
    else flattenMessages(v, key, out)
  }
  return out
}

function flat(tree: MessageTree): Map<string, string> {
  let m = flatCache.get(tree)
  if (!m) { m = flattenMessages(tree); flatCache.set(tree, m) }
  return m
}

/** Texto crudo (sin formatear) de una clave para un locale, siguiendo la cascada. */
export function resolveMessage(
  key: string,
  locale: string = DEFAULT_LOCALE,
  catalogs: Record<string, MessageTree> = CATALOGS,
): string | null {
  for (const tag of localeChain(locale)) {
    const tree = catalogs[tag]
    if (!tree) continue
    const msg = flat(tree).get(key)
    if (msg !== undefined && msg !== '') return msg
  }
  return null
}

export type Translator = ((key: string, values?: MessageValues) => string) & {
  locale: string
  has: (key: string) => boolean
}

/**
 * Traductor ligado a un locale y, opcionalmente, a un namespace:
 *   const t = createTranslator('es-ES', 'shop'); t('cart') → 'Cesta'
 */
export function createTranslator(
  locale: string = DEFAULT_LOCALE,
  namespace?: string,
  catalogs: Record<string, MessageTree> = CATALOGS,
): Translator {
  const full = (key: string) => (namespace ? `${namespace}.${key}` : key)
  const t = ((key: string, values?: MessageValues) => {
    const k = full(key)
    const msg = resolveMessage(k, locale, catalogs)
    if (msg === null) return k
    try {
      return formatMessage(msg, values, locale)
    } catch {
      return msg // sintaxis inválida: se muestra el texto crudo (el guard de CI lo detecta)
    }
  }) as Translator
  t.locale = locale
  t.has = (key: string) => resolveMessage(full(key), locale, catalogs) !== null
  return t
}

/** Mensajes efectivos (aplanados) de un locale tras aplicar la cascada: útil para enviar al cliente. */
export function messagesFor(locale: string = DEFAULT_LOCALE, catalogs: Record<string, MessageTree> = CATALOGS): Record<string, string> {
  const out: Record<string, string> = {}
  for (const tag of [...localeChain(locale)].reverse()) {
    const tree = catalogs[tag]
    if (tree) for (const [k, v] of flat(tree)) if (v !== '') out[k] = v
  }
  return out
}
