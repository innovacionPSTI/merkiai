'use client'

import { Suspense, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStackApp } from '@stackframe/stack'
import { LoginScreen } from '@merkiai/ui'
import { CONSOLE_LOGIN_CONTENT, CONSOLE_BRAND } from '@/lib/login-content'

function ConsoleLogin() {
  const app = useStackApp()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(email: string, password: string) {
    if (!email || !password) {
      setError('Ingresa tu correo y contraseña.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await app.signInWithCredential({ email, password })
      if (result.status === 'error') {
        setError('Correo o contraseña incorrectos.')
      } else {
        router.push('/')
      }
    } catch {
      setError('Ocurrió un error. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  async function handleMagicLink(mail: string) {
    setError(null)
    try {
      await app.sendMagicLinkEmail(mail)
    } catch {
      setError('No se pudo enviar el enlace. Verifica el correo.')
    }
  }

  return (
    <LoginScreen
      content={CONSOLE_LOGIN_CONTENT}
      brand={CONSOLE_BRAND}
      onSubmit={handleSubmit}
      onMagicLink={handleMagicLink}
      loading={loading}
      error={error}
    />
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <ConsoleLogin />
    </Suspense>
  )
}
