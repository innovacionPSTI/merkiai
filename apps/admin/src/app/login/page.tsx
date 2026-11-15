'use client'

import { Suspense, useEffect, useState } from 'react'
import { safeReturnPath } from '@merkiai/tenancy/security'
import { useRouter, useSearchParams } from 'next/navigation'
import { useStackApp, useUser } from '@stackframe/stack'
import { LoginScreen } from '@merkiai/ui'
import { ADMIN_LOGIN_CONTENT, ADMIN_BRAND } from '@/lib/login-content'
import { useTx } from '@merkiai/ui'

function AdminLogin() {
  const tx = useTx()
  const app = useStackApp()
  const user = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  // Hardening: solo rutas relativas del mismo origen (evita open redirect).
  const returnTo = safeReturnPath(searchParams.get('after_auth_return_to'), '/dashboard')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // HU-158/214: si ya hay sesión (p.ej. tras volver de Google OAuth), reenviar.
  useEffect(() => {
    if (user) router.replace(returnTo)
  }, [user, returnTo, router])

  async function handleSubmit(email: string, password: string) {
    if (!email || !password) {
      setError(tx("Ingresa tu correo y contraseña."))
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await app.signInWithCredential({ email, password })
      if (result.status === 'error') {
        setError(tx("Correo o contraseña incorrectos."))
      } else {
        router.push(returnTo)
      }
    } catch {
      setError(tx("Ocurrió un error. Intenta de nuevo."))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    try {
      await app.signInWithOAuth('google')
    } catch {
      setError(tx("No se pudo iniciar con Google."))
    }
  }

  return (
    <LoginScreen
      content={ADMIN_LOGIN_CONTENT}
      brand={ADMIN_BRAND}
      onSubmit={handleSubmit}
      onGoogle={handleGoogle}
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
