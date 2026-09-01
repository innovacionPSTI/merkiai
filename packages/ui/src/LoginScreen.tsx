'use client'

import { useState, type CSSProperties, type ReactNode } from 'react'

/**
 * Pantalla de login split-screen, temeable y con contenido editable.
 * Estilos inline + variables CSS → funciona sin Tailwind (p. ej. en console).
 * La lógica de auth (Stack Auth) se inyecta por callbacks; este componente es
 * puramente presentacional.
 */

export interface LoginBrand {
  /** Color primario (marca). */
  primary?: string
  /** Degradado del panel izquierdo. */
  gradientFrom?: string
  gradientTo?: string
  /** Texto sobre el panel de marca. */
  onBrand?: string
  /** Radio de bordes. */
  radius?: string
}

export interface LoginConceptCard {
  title: string
  lines: string[]
}

export interface LoginContent {
  /** Wordmark / nombre de marca (arriba a la izquierda y en el card). */
  brandName: string
  /** Chip superior del panel de marca. */
  badge?: string
  /** Titular grande del panel de marca. */
  headline: string
  /** Subtítulo bajo el titular. */
  subhead?: string
  /** Chips inferiores (canales, features…). */
  features?: string[]
  /** Tarjetas-concepto decorativas del panel de marca. */
  cards?: LoginConceptCard[]
  /** Pie del panel de marca. */
  footer?: string
  /** Título del formulario. */
  title: string
  /** Subtítulo del formulario. */
  subtitle?: string
  emailLabel?: string
  emailPlaceholder?: string
  passwordLabel?: string
  submitLabel?: string
  loadingLabel?: string
  googleLabel?: string
  magicLinkLabel?: string
  /** Textos del paso de Email OTP (cuando se pasa `onOtpVerify`). */
  otpSentHint?: string
  otpCodePlaceholder?: string
  otpVerifyLabel?: string
  otpResendLabel?: string
  forgotLabel?: string
  forgotHref?: string
  keepSignedLabel?: string
}

export interface LoginScreenProps {
  content: LoginContent
  brand?: LoginBrand
  onSubmit: (email: string, password: string) => void | Promise<void>
  onGoogle?: () => void | Promise<void>
  /** Envía un enlace/código de acceso al email (magic link / Email OTP). */
  onMagicLink?: (email: string) => void | Promise<void>
  /**
   * Verifica el código de Email OTP que el usuario recibió. Si se pasa (junto
   * con `onMagicLink`), tras "enviar código" se muestra el paso de ingreso de
   * código (HU-214g). Si se omite, se mantiene el comportamiento de magic link
   * por enlace (web/admin) sin cambios.
   */
  onOtpVerify?: (code: string) => void | Promise<void>
  loading?: boolean
  error?: string | null
}

const DEFAULT_BRAND: Required<LoginBrand> = {
  primary: '#2E5A3B',
  gradientFrom: '#3C7A4E',
  gradientTo: '#22412E',
  onBrand: '#FFFFFF',
  radius: '14px',
}

export function LoginScreen({ content, brand, onSubmit, onGoogle, onMagicLink, onOtpVerify, loading, error }: LoginScreenProps) {
  const b = { ...DEFAULT_BRAND, ...brand }
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [magicSent, setMagicSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')

  const vars = {
    '--brand': b.primary,
    '--brand-from': b.gradientFrom,
    '--brand-to': b.gradientTo,
    '--on-brand': b.onBrand,
    '--radius': b.radius,
  } as CSSProperties

  const input: CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: '12px 14px', fontSize: 14,
    border: '1px solid #d8d8e0', borderRadius: 'var(--radius)', outline: 'none',
  }
  const label: CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: '#222', marginBottom: 6 }

  return (
    <div style={{ ...vars, display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <style>{`@media (max-width: 860px){ .login-brand-panel{ display:none !important; } }`}</style>
      {/* ── Panel de marca ─────────────────────────────────────────────── */}
      <aside
        style={{
          flex: '1 1 50%', position: 'relative', color: 'var(--on-brand)',
          background: 'linear-gradient(150deg, var(--brand-from), var(--brand-to))',
          padding: '40px 48px', display: 'flex', flexDirection: 'column',
        }}
        className="login-brand-panel"
      >
        <div style={{ fontWeight: 700, fontSize: 20 }}>{content.brandName}</div>

        <div style={{ marginTop: 'auto', marginBottom: 'auto', maxWidth: 520 }}>
          {content.badge && (
            <span style={{
              display: 'inline-block', fontSize: 12, padding: '6px 12px', borderRadius: 999,
              background: 'rgba(255,255,255,0.16)', marginBottom: 20,
            }}>● {content.badge}</span>
          )}
          <h1 style={{ fontSize: 40, lineHeight: 1.1, margin: '0 0 16px', fontWeight: 800 }}>{content.headline}</h1>
          {content.subhead && <p style={{ fontSize: 16, opacity: 0.85, margin: 0 }}>{content.subhead}</p>}

          {content.cards && content.cards.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 28 }}>
              {content.cards.map((c, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)',
                  borderRadius: 'var(--radius)', padding: 14, minWidth: 180,
                }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{c.title}</div>
                  {c.lines.map((l, j) => (
                    <div key={j} style={{ fontSize: 12, opacity: 0.85 }}>{l}</div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.75 }}>
          <span>{(content.features ?? []).join(' · ')}</span>
          <span>{content.footer}</span>
        </div>
      </aside>

      {/* ── Panel de formulario ────────────────────────────────────────── */}
      <section style={{ flex: '1 1 50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--brand)', marginBottom: 24 }}>{content.brandName}</div>
          <h2 style={{ fontSize: 30, margin: '0 0 6px', color: '#111' }}>{content.title}</h2>
          {content.subtitle && <p style={{ color: '#666', marginTop: 0, marginBottom: 24 }}>{content.subtitle}</p>}

          <form
            onSubmit={(e) => { e.preventDefault(); if (!loading) void onSubmit(email, password) }}
          >
            <div style={{ marginBottom: 16 }}>
              <label style={label}>{content.emailLabel ?? 'Correo'}</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder={content.emailPlaceholder ?? 'tu@empresa.com'} required autoComplete="email"
                style={{ ...input, borderColor: 'var(--brand)' }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={label}>{content.passwordLabel ?? 'Contraseña'}</label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" required autoComplete="current-password" style={input}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <label style={{ fontSize: 13, color: '#444', display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" defaultChecked style={{ accentColor: 'var(--brand)' }} />
                {content.keepSignedLabel ?? 'Mantener sesión'}
              </label>
              {content.forgotHref && (
                <a href={content.forgotHref} style={{ fontSize: 13, color: 'var(--brand)', textDecoration: 'none' }}>
                  {content.forgotLabel ?? '¿Olvidaste tu contraseña?'}
                </a>
              )}
            </div>

            {error && (
              <div style={{ background: '#fdecec', border: '1px solid #f6c9c9', borderRadius: 'var(--radius)', padding: '10px 12px', marginBottom: 14 }}>
                <span style={{ color: '#b00', fontSize: 13 }}>{error}</span>
              </div>
            )}

            <button
              type="submit" disabled={loading}
              style={{
                width: '100%', padding: '13px', fontSize: 15, fontWeight: 600, color: 'var(--on-brand)',
                background: 'var(--brand)', border: 0, borderRadius: 'var(--radius)', cursor: loading ? 'wait' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (content.loadingLabel ?? 'Ingresando…') : (content.submitLabel ?? 'Iniciar sesión')}
            </button>
          </form>

          {(onGoogle || onMagicLink) && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
                <div style={{ flex: 1, height: 1, background: '#eee' }} />
                <span style={{ fontSize: 12, color: '#999' }}>o</span>
                <div style={{ flex: 1, height: 1, background: '#eee' }} />
              </div>

              {onGoogle && (
                <button
                  type="button" onClick={() => void onGoogle()} disabled={loading}
                  style={{
                    width: '100%', padding: '12px', fontSize: 14, fontWeight: 600, color: '#333',
                    background: '#fff', border: '1px solid #ddd', borderRadius: 'var(--radius)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: onMagicLink ? 8 : 0,
                  }}
                >
                  <GoogleIcon /> {content.googleLabel ?? 'Continuar con Google'}
                </button>
              )}

              {onMagicLink && (
                magicSent ? (
                  onOtpVerify ? (
                    // HU-214g · paso de Email OTP: ingresar y verificar el código.
                    <div>
                      <p style={{ fontSize: 13, color: '#2E5A3B', textAlign: 'center', margin: '0 0 10px' }}>
                        {content.otpSentHint ?? 'Te enviamos un código a'} <strong>{email}</strong>.
                      </p>
                      <input
                        type="text" inputMode="numeric" autoComplete="one-time-code"
                        value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\s/g, ''))}
                        placeholder={content.otpCodePlaceholder ?? 'Código de 6 dígitos'}
                        style={{ ...input, textAlign: 'center', letterSpacing: 2, marginBottom: 8 }}
                      />
                      <button
                        type="button" disabled={loading || otpCode.length < 6}
                        onClick={() => void onOtpVerify(otpCode)}
                        style={{
                          width: '100%', padding: '12px', fontSize: 14, fontWeight: 600, color: 'var(--on-brand)',
                          background: 'var(--brand)', border: 0, borderRadius: 'var(--radius)',
                          cursor: (loading || otpCode.length < 6) ? 'default' : 'pointer', opacity: (loading || otpCode.length < 6) ? 0.6 : 1,
                        }}
                      >
                        {content.otpVerifyLabel ?? 'Verificar código'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setMagicSent(false); setOtpCode('') }}
                        style={{ width: '100%', marginTop: 8, background: 'none', border: 0, color: 'var(--brand)', fontSize: 13, cursor: 'pointer' }}
                      >
                        {content.otpResendLabel ?? 'Reenviar código'}
                      </button>
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: '#2E5A3B', textAlign: 'center', margin: 0 }}>
                      Te enviamos un enlace de acceso a <strong>{email}</strong>. Revisa tu correo.
                    </p>
                  )
                ) : (
                  <button
                    type="button"
                    disabled={loading || !email}
                    onClick={async () => { await onMagicLink(email); setMagicSent(true) }}
                    style={{
                      width: '100%', padding: '12px', fontSize: 14, fontWeight: 600, color: '#333',
                      background: '#fff', border: '1px solid #ddd', borderRadius: 'var(--radius)',
                      cursor: (loading || !email) ? 'default' : 'pointer', opacity: (loading || !email) ? 0.6 : 1,
                    }}
                  >
                    {content.magicLinkLabel ?? (onOtpVerify ? 'Enviar código al correo' : 'Enviar enlace de acceso al correo')}
                  </button>
                )
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}

function GoogleIcon(): ReactNode {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.6l-6.5 5C9.6 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.3 5.2C41.9 35.6 44 30.3 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  )
}

export default LoginScreen
