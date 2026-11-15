/**
 * @merkiai/i18n — internacionalización de la plataforma (E28 · HU-460 · ADR-011).
 *
 *  - `locales`  : locales soportados, normalización, cadena de resolución, Accept-Language.
 *  - `messages` : catálogos por idioma + sobrescrituras regionales, traductor en cascada (ICU).
 *  - `format`   : moneda (siempre desde el dato), números, fechas, relativo.
 */
export * from './locales'
export * from './messages'
export * from './format'
export * from './regions'
export { translatePhrase, phraseKey, PHRASES, localizeMessages, hasMessages } from './phrases'
export { formatMessage, parseMessage, MessageSyntaxError } from './icu'
export { CATALOGS } from './catalogs'
