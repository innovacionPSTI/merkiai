import type { ReactNode } from 'react'
import { StackProvider, StackTheme } from '@stackframe/stack'
import { headers } from 'next/headers'
import { stackServerApp } from '../stack'

export const metadata = {
  title: 'Merkiai · Control Plane',
  description: 'Operación de la plataforma Merkiai (interno).',
  robots: { index: false, follow: false },
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Hardening · nonce de la CSP (middleware) para los scripts inline de Stack Auth.
  const nonce = (await headers()).get('x-nonce') ?? undefined
  return (
    <html lang="es">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0 }}>
        <StackProvider app={stackServerApp}>
          <StackTheme nonce={nonce}>{children}</StackTheme>
        </StackProvider>
      </body>
    </html>
  )
}
