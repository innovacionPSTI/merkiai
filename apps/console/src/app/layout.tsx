import type { ReactNode } from 'react'
import { StackProvider, StackTheme } from '@stackframe/stack'
import { headers } from 'next/headers'
import { stackServerApp } from '../stack'
import { I18nProvider } from '@merkiai/ui'
import { getConsoleLocale } from '@/lib/ui-locale'

export const metadata = {
  title: 'Merkiai · Control Plane',
  description: 'Operación de la plataforma Merkiai (interno).',
  robots: { index: false, follow: false },
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Hardening · nonce de la CSP (middleware) para los scripts inline de Stack Auth.
  const nonce = (await headers()).get('x-nonce') ?? undefined
  // E28 · HU-466 · idioma de la consola (es/en por operador).
  const locale = await getConsoleLocale().catch(() => 'es-CO')
  return (
    <html lang={locale}>
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0 }}>
        <StackProvider app={stackServerApp}>
          <StackTheme nonce={nonce}><I18nProvider locale={locale}>{children}</I18nProvider></StackTheme>
        </StackProvider>
      </body>
    </html>
  )
}
