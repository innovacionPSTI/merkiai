'use client'

/**
 * Selector del idioma del panel (E28 · HU-466 AC-1). Es una preferencia
 * personal: no afecta a otros usuarios ni a los idiomas de la tienda.
 */
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useT } from '@merkiai/ui'
import { SUPPORTED_LOCALES, LOCALE_INFO } from '@merkiai/i18n'
import { setAdminLocaleAction } from '@/app/actions/ui-locale'

export default function PanelLocaleSelect() {
  const locale = useLocale()
  const t = useT('admin.common')
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <label className="flex items-center gap-2 font-brand text-xs text-brand-cream/60">
      <span className="sr-only">{t('language')}</span>
      <span aria-hidden="true">🌐</span>
      <select
        value={locale}
        disabled={pending}
        aria-label={t('language')}
        onChange={(e) => start(async () => { await setAdminLocaleAction(e.target.value); router.refresh() })}
        className="flex-1 rounded-lg bg-transparent border border-brand-cream/20 px-2 py-1 text-brand-cream/80 focus:outline-none"
      >
        {SUPPORTED_LOCALES.map((l) => <option key={l} value={l} className="text-black">{LOCALE_INFO[l].label}</option>)}
      </select>
    </label>
  )
}
