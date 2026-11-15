'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useT } from '@merkiai/ui'
import { setConsoleLocaleAction } from '@/app/locale-actions'

/** Selector de idioma de la consola (es / en). */
export default function ConsoleLocaleSelect() {
  const locale = useLocale()
  const t = useT('console.common')
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <select
      aria-label={t('language')}
      value={locale.startsWith('en') ? 'en-US' : 'es-CO'}
      disabled={pending}
      onChange={(e) => start(async () => { await setConsoleLocaleAction(e.target.value); router.refresh() })}
      style={{ fontSize: 13, padding: '5px 8px', borderRadius: 6, border: '1px solid #ccc', background: '#fff' }}
    >
      <option value="es-CO">Español</option>
      <option value="en-US">English</option>
    </select>
  )
}
