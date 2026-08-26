import type { LoginContent, LoginBrand } from '@merkiai/ui'

/**
 * Contenido y marca del login del PANEL ADMIN (operadores de la tienda).
 * Editable aquí. Colores por defecto de Merkiai; sobreescribibles con la paleta
 * final o, a futuro, con el tema del tenant.
 */
export const ADMIN_LOGIN_CONTENT: LoginContent = {
  brandName: 'Merkiai',
  badge: 'Panel de administración',
  headline: 'Gestiona tu tienda de principio a fin.',
  subhead: 'Catálogo, pedidos, envíos, contenido y pagos — en un solo lugar.',
  features: ['Catálogo', 'Pedidos', 'Envíos', 'Contenido'],
  footer: '© 2026 Merkiai',
  cards: [
    { title: 'Pedidos', lines: ['Estado en tiempo real', 'Confirmación de pago'] },
    { title: 'Catálogo', lines: ['Productos y variantes', 'Inventario'] },
  ],
  title: 'Bienvenido',
  subtitle: 'Ingresa al panel de administración.',
  emailLabel: 'Correo',
  emailPlaceholder: 'admin@tutienda.com',
  passwordLabel: 'Contraseña',
  submitLabel: 'Ingresar',
  loadingLabel: 'Ingresando…',
  keepSignedLabel: 'Mantener sesión',
  forgotLabel: '¿Olvidaste tu contraseña?',
  forgotHref: '/handler/forgot-password',
}

export const ADMIN_BRAND: LoginBrand = {
  primary: '#2E5A3B',
  gradientFrom: '#3C7A4E',
  gradientTo: '#22412E',
}
