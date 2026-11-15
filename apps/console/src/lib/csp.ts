import { nonceScriptSrc } from '@merkiai/tenancy/security'

/**
 * Hardening · CSP de la consola con nonce por petición (la emite el middleware).
 * La consola no se incrusta, no carga scripts de terceros y solo habla con su
 * Supabase y Stack Auth.
 */
export function contentSecurityPolicy(nonce: string): string {
  return [
    "default-src 'self'",
    nonceScriptSrc(nonce, { dev: process.env.NODE_ENV !== 'production' }),
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: blob: https://*.supabase.co",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.stack-auth.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ')
}
