'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStackApp, useUser } from '@stackframe/stack'
import { LoginScreen } from '@merkiai/ui'
import { CONSOLE_LOGIN_CONTENT, CONSOLE_BRAND } from '@/lib/login-content'

function ConsoleLogin() {
  const app = useStackApp()
  const user = useUser()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [otpNonce, setOtpNonce] = useState<string | null>(null) // HU-214g

  // HU-214: si ya hay sesión (p.ej. tras magic link/OAuth), reenviar a la consola.
  useEffect(() => {
    if (user) router.replace('/')
  }, [user, router])

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

  // HU-214g · Email OTP: enviar código. `sendMagicLinkEmail` devuelve un `nonce`
  // que identifica el intento; el correo incluye un código de 6 dígitos. El
  // nonce se guarda para completar la verificación.
  async function handleMagicLink(mail: string) {
    setError(null)
    try {
      const res = await app.sendMagicLinkEmail(mail)
      // La forma del resultado puede variar según versión de Stack Auth; se
      // extrae el nonce de forma defensiva.
      const nonce = (res as { data?: { nonce?: string }; nonce?: string })?.data?.nonce
        ?? (res as { nonce?: string })?.nonce
        ?? null
      setOtpNonce(nonce)
    } catch {
      setError('No se pudo enviar el código. Verifica el correo.')
    }
  }

  // HU-214g · verificar el código. Stack Auth completa el OTP con
  // `signInWithMagicLink(codigo + nonce)`.
  async function handleOtpVerify(code: string) {
    setError(null); setLoading(true)
    try {
      const fullCode = otpNonce ? `${code}${otpNonce}` : code
      const result = await app.signInWithMagicLink(fullCode)
      if (result.status === 'error') {
        setError('Código inválido o expirado. Reenvía e intenta de nuevo.')
      } else {
        router.push('/')
      }
    } catch {
      setError('No se pudo verificar el código. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <LoginScreen
      content={CONSOLE_LOGIN_CONTENT}
      brand={CONSOLE_BRAND}
      onSubmit={handleSubmit}
      onMagicLink={handleMagicLink}
      onOtpVerify={handleOtpVerify}
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
