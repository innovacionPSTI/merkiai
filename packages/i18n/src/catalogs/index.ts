import es from './es'
import esCO from './es-CO'
import esMX from './es-MX'
import esES from './es-ES'
import en from './en'
import enUS from './en-US'

/** Árbol de mensajes: namespaces anidados con textos ICU en las hojas. */
export interface MessageTree { [key: string]: string | MessageTree }

/**
 * Catálogos de la plataforma por etiqueta (idioma base o locale). Agregar un
 * idioma = agregar su archivo y registrarlo aquí; agregar una variante regional =
 * un archivo con solo las diferencias.
 */
export const CATALOGS: Record<string, MessageTree> = {
  es: es as unknown as MessageTree,
  'es-CO': esCO,
  'es-MX': esMX,
  'es-ES': esES,
  en,
  'en-US': enUS,
}
