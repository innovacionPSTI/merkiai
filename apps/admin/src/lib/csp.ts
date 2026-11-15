import { nonceScriptSrc } from '@merkiai/tenancy/security'

/**
 * Hardening · Content-Security-Policy del panel, con nonce por petición
 * (la emite el middleware; antes vivía estática en next.config con 'unsafe-inline').
 * El script de PayZen se inyecta desde un script con nonce → lo autoriza 'strict-dynamic'.
 */

// HU-440 · formulario incrustado de PayZen (librería, estilos, API, iframes de 3DS).
const PAYZEN = 'https://static.payzen.lat https://api.payzen.lat https://*.payzen.lat'

function mediaOrigin(): string {
  try { return process.env.STORAGE_PUBLIC_BASE_URL ? new URL(process.env.STORAGE_PUBLIC_BASE_URL).origin : '' } catch { return '' }
}

export function contentSecurityPolicy(nonce: string): string {
  // HU-128 v3 · el Constructor incrusta la tienda del tenant en el iframe de vista previa.
  const storefront = (process.env.STOREFRONT_BASE_DOMAIN ?? 'merkiai.com').trim()
  return [
    "default-src 'self'",
    nonceScriptSrc(nonce, { dev: process.env.NODE_ENV !== 'production' }),
    `style-src 'self' 'unsafe-inline' ${PAYZEN}`,
    `font-src 'self' ${PAYZEN}`,
    `img-src 'self' data: blob: https://*.supabase.co ${PAYZEN} ${mediaOrigin()}`.trim(),
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.stack-auth.com ${PAYZEN}`,
    `frame-src 'self' https://*.${storefront} ${PAYZEN}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
    `form-action 'self' ${PAYZEN}`,
  ].join('; ')
}
