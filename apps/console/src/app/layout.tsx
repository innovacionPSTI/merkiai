import type { ReactNode } from 'react'
import { StackProvider, StackTheme } from '@stackframe/stack'
import { stackServerApp } from '../stack'

export const metadata = {
  title: 'Merkiai · Control Plane',
  description: 'Operación de la plataforma Merkiai (interno).',
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0 }}>
        <StackProvider app={stackServerApp}>
          <StackTheme>{children}</StackTheme>
        </StackProvider>
      </body>
    </html>
  )
}
