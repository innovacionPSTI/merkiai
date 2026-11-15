/**
 * @merkiai/tenancy — utilidades de seguridad PURAS compartidas por las apps
 * (hardening transversal: XSS, open redirect, CSRF por Origin, sniffing de archivos).
 */

/** Escapa texto para insertarlo en HTML (contenido o atributos entre comillas). */
export function escapeHtml(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Serializa JSON para incrustarlo en `<script type="application/ld+json">`.
 * `JSON.stringify` NO escapa `</script>`: un nombre de producto con
 * `</script><script>…` rompería el bloque (XSS). Se escapan `<`, `>`, `&` y los
 * separadores de línea U+2028/2029 como secuencias Unicode (JSON válido).
 */
export function safeJsonForScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

/**
 * Destino de retorno seguro tras login: solo rutas RELATIVAS del mismo origen.
 * Rechaza `//evil.com`, `/\\evil.com`, `https://…`, `javascript:` → fallback.
 */
export function safeReturnPath(raw: string | null | undefined, fallback = '/'): string {
  const v = (raw ?? '').trim()
  if (!v.startsWith('/') || v.startsWith('//') || v.startsWith('/\\') || /[\r\n\t]/.test(v)) return fallback
  return v
}

/** Nombre visible para el remitente de un correo (sin caracteres que rompan la cabecera). */
export function safeFromName(name: string | null | undefined, fallback = 'Mi Tienda'): string {
  const n = String(name ?? '').replace(/[<>"\\\r\n]/g, '').trim().slice(0, 80)
  return n || fallback
}

/**
 * CSRF por Origin (defensa en profundidad): una petición que MUTA estado y trae
 * cabecera `Origin` debe venir del mismo host. Sin `Origin` (server-to-server,
 * navegadores antiguos con GET) se deja pasar: la autenticación sigue aplicando.
 */
export function isCrossSiteMutation(method: string, origin: string | null, host: string | null): boolean {
  if (['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) return false
  if (!origin) return false
  if (origin === 'null') return true
  try {
    return new URL(origin).host.toLowerCase() !== (host ?? '').toLowerCase()
  } catch {
    return true
  }
}

/** Tipo real de imagen por "magic bytes" (no confiar en el content-type del cliente). */
export function sniffImageType(bytes: Uint8Array): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' | null {
  const b = bytes
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return 'image/png'
  if (b.length >= 6 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return 'image/gif'
  if (b.length >= 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'image/webp'
  return null
}

// ── CSP con nonce ──────────────────────────────────────────────────────────────

/** Nonce aleatorio por petición (base64 de 128 bits; Web Crypto, válido en edge y node). */
export function generateNonce(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

/**
 * Directiva `script-src` estricta con nonce (CSP nivel 3):
 *  - `'nonce-…'` + `'strict-dynamic'`: solo corren los scripts que Next.js marca
 *    con el nonce y los que ESOS scripts carguen (chunks, PayZen, analytics).
 *    Un `<script>` inyectado por un atacante (XSS) no trae el nonce → bloqueado.
 *  - `https:` y `'unsafe-inline'` son SOLO compatibilidad con navegadores sin
 *    CSP3: los modernos los ignoran cuando hay nonce/strict-dynamic.
 *  - `'unsafe-eval'` solo en desarrollo (React Refresh).
 */
export function nonceScriptSrc(nonce: string, opts: { dev?: boolean } = {}): string {
  return `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${opts.dev ? " 'unsafe-eval'" : ''} https: 'unsafe-inline'`
}
