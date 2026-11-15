'use client'

/**
 * Aviso "¿Ver en …?" (E28 · HU-462 AC-6). El idioma del navegador SOLO sugiere:
 * nunca redirige. No aparece si el visitante ya eligió idioma o lo descartó.
 */
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createTranslator, matchAcceptLanguage, type Locale } from '@merkiai/i18n'
import { switchHref, type LocaleOption } from './LocaleSwitcher'

const DISMISS_COOKIE = 'merkiai_locale_dismiss'

function hasCookie(name: string) {
  return typeof document !== 'undefined' && document.cookie.split(';').some((c) => c.trim().startsWith(`${name}=`))
}

export default function LocaleSuggest({ locales, current }: { locales: LocaleOption[]; current: string }) {
  const pathname = usePathname() ?? '/'
  const [suggested, setSuggested] = useState<LocaleOption | null>(null)

  useEffect(() => {
    if (locales.length <= 1 || hasCookie('merkiai_locale') || hasCookie(DISMISS_COOKIE)) return
    const pick = matchAcceptLanguage(navigator.languages?.join(',') || navigator.language, locales.map((l) => l.code as Locale))
    if (pick && pick !== current) setSuggested(locales.find((l) => l.code === pick) ?? null)
  }, [locales, current])

  if (!suggested) return null
  const t = createTranslator(suggested.code)
  const dismiss = () => {
    document.cookie = `${DISMISS_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`
    setSuggested(null)
  }
  return (
    <div role="region" aria-label={t('common.language')} lang={suggested.code} className="w-full bg-brand-primary text-brand-cream">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-3 px-4 py-2 font-brand text-sm">
        <span>{t('shop.suggest_locale', { language: suggested.label })}</span>
        <a href={switchHref(suggested.code, pathname, locales.map((l) => l.code))} className="rounded-full bg-brand-cream px-3 py-1 text-brand-primary">{suggested.label}</a>
        <button type="button" onClick={dismiss} className="underline opacity-80">{t('common.close')}</button>
      </div>
    </div>
  )
}
