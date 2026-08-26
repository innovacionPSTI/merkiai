import type { LoginContent, LoginBrand } from '@merkiai/ui'

/**
 * Contenido y marca del login del CONTROL PLANE. Editable aquí (concepto +
 * textos). Los colores por defecto son los de Merkiai; se pueden sobreescribir
 * cuando la marca defina su paleta final.
 */
export const CONSOLE_LOGIN_CONTENT: LoginContent = {
  brandName: 'Merkiai',
  badge: 'Plataforma de comercio AI-native',
  headline: 'Opera todas tus tiendas desde un solo lugar.',
  subhead: 'Alta de tenants, planes, facturación y dominios — con el control y la seguridad de la plataforma.',
  features: ['Tenants', 'Planes', 'Facturación', 'Dominios'],
  footer: '© 2026 Merkiai',
  cards: [
    { title: 'Tenants activos', lines: ['Alta en segundos', 'Aislamiento por RLS'] },
    { title: 'Facturación', lines: ['Suscripción por plan', 'Suspensión por impago'] },
  ],
  title: 'Bienvenido',
  subtitle: 'Ingresa a la consola de operación de Merkiai.',
  emailLabel: 'Correo',
  emailPlaceholder: 'operador@merkiai.com',
  passwordLabel: 'Contraseña',
  submitLabel: 'Ingresar',
  loadingLabel: 'Ingresando…',
  googleLabel: 'Continuar con Google',
  keepSignedLabel: 'Mantener sesión',
  forgotLabel: '¿Olvidaste tu contraseña?',
  forgotHref: '/handler/forgot-password',
}

/** Marca por defecto (Merkiai). Ajustar cuando exista la paleta final. */
export const CONSOLE_BRAND: LoginBrand = {
  primary: '#2E5A3B',
  gradientFrom: '#3C7A4E',
  gradientTo: '#22412E',
}
