import { nonceScriptSrc } from '@merkiai/tenancy/security'

/**
 * Hardening · Content-Security-Policy del storefront, con nonce por petición
 * (la emite el middleware; antes vivía estática en next.config con 'unsafe-inline').
 */

// HU-128 v3 · la vista previa del Constructor embebe la tienda en un iframe desde el admin.
function frameAncestors(): string {
  const admin = process.env.ADMIN_PREVIEW_ORIGIN?.trim()
  return admin ? `'self' ${admin}` : "'none'"
}

// HU-432 · origen público de los archivos cuando el storage es R2/S3.
function mediaOrigin(): string {
  try { return process.env.STORAGE_PUBLIC_BASE_URL ? new URL(process.env.STORAGE_PUBLIC_BASE_URL).origin : '' } catch { return '' }
}

export function contentSecurityPolicy(nonce: string): string {
  return [
    "default-src 'self'",
    nonceScriptSrc(nonce, { dev: process.env.NODE_ENV !== 'production' }),
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    `img-src 'self' data: blob: https://*.supabase.co https://res.cloudinary.com ${mediaOrigin()}`.trim(),
    // Stack Auth + Supabase + Vercel Analytics
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.stack-auth.com https://*.vercel-insights.com https://vitals.vercel-insights.com",
    "media-src 'self' https://*.supabase.co",
    `frame-ancestors ${frameAncestors()}`,
    "base-uri 'self'",
    // /pagar-saldo (HU-455) envía el formulario a la tienda, que redirige a la pasarela.
    "form-action 'self' https://checkout.wompi.co https://*.mercadopago.com https://*.mercadopago.com.co https://checkout.bold.co https://*.payzen.lat",
    "object-src 'none'",
  ].join('; ')
}
