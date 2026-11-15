'use client'

/**
 * Selector de idioma del storefront (E28 · HU-462). Solo se muestra si la tienda
 * publica más de un idioma. Cambiar de idioma pasa por `/api/locale`, que guarda
 * la elección y lleva a la misma página en el idioma elegido.
 */
import { usePathname } from 'next/navigation'
import { createTranslator } from '@merkiai/i18n'

export interface LocaleOption { code: string; label: string }

/** Quita el prefijo de idioma de la ruta visible (`/en-us/shop` → `/shop`). */
export function stripLocalePrefix(pathname: string, codes: string[]): string {
  const segs = codes.map((c) => c.toLowerCase())
  const m = /^\/([a-z]{2}-[a-z]{2})(\/.*)?$/.exec(pathname)
  if (m && segs.includes(m[1])) return m[2] && m[2] !== '/' ? m[2] : '/'
  return pathname
}

export function switchHref(code: string, pathname: string, codes: string[]): string {
  return `/api/locale?set=${encodeURIComponent(code)}&next=${encodeURIComponent(stripLocalePrefix(pathname, codes))}`
}

export default function LocaleSwitcher({ locales, current }: { locales: LocaleOption[]; current: string }) {
  const pathname = usePathname() ?? '/'
  if (locales.length <= 1) return null
  const codes = locales.map((l) => l.code)
  const t = createTranslator(current)
  return (
    <nav aria-label={t('common.language')} className="flex flex-wrap items-center gap-2 font-brand text-xs">
      <span className="opacity-70">{t('common.language')}:</span>
      {locales.map((l) => (
        l.code === current
          ? <span key={l.code} aria-current="true" className="font-semibold">{l.label}</span>
          : <a key={l.code} href={switchHref(l.code, pathname, codes)} hrefLang={l.code} lang={l.code} className="underline opacity-80 hover:opacity-100">{l.label}</a>
      ))}
    </nav>
  )
}
