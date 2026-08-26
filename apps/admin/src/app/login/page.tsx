'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useStackApp } from '@stackframe/stack'
import { LoginScreen } from '@merkiai/ui'
import { ADMIN_LOGIN_CONTENT, ADMIN_BRAND } from '@/lib/login-content'

function AdminLogin() {
  const app = useStackApp()
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('after_auth_return_to') ?? '/dashboard'
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
        router.push(returnTo)
      }
    } catch {
      setError('Ocurrió un error. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // Sin Google: los operadores de tienda entran con credencial (sign-up deshabilitado).
  return (
    <LoginScreen
      content={ADMIN_LOGIN_CONTENT}
      brand={ADMIN_BRAND}
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
    />
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <AdminLogin />
    </Suspense>
  )
}
