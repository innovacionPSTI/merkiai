/**
 * Firma un JWT `authenticated` de Supabase para validar el aislamiento entre
 * compradores (HU-156). Sin dependencias: HMAC-SHA256 con crypto nativo.
 *
 * Claims: { role:'authenticated', tenant_id, sub, aud:'authenticated', iat, exp }
 * — casan con las políticas RLS (auth.jwt()->>'tenant_id' / ->>'sub').
 *   `sub` DEBE ser el `customers.stack_id` del comprador.
 *
 * Uso:
 *   SUPABASE_JWT_SECRET='<legacy jwt secret>' \
 *     node scripts/mint-user-jwt.mjs <stack_id> <tenant_id> [role=authenticated]
 */
import crypto from 'node:crypto'

const b64url = (buf) =>
  Buffer.from(buf).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

const [, , sub, tenantId, role = 'authenticated'] = process.argv
const secret = process.env.SUPABASE_JWT_SECRET

if (!secret) { console.error('❌ Falta SUPABASE_JWT_SECRET (Legacy JWT secret).'); process.exit(1) }
if (!sub || !tenantId) {
  console.error('Uso: node scripts/mint-user-jwt.mjs <stack_id> <tenant_id> [role]')
  process.exit(1)
}

const now = Math.floor(Date.now() / 1000)
const header = { alg: 'HS256', typ: 'JWT' }
const payload = { role, tenant_id: tenantId, sub, aud: 'authenticated', iat: now, exp: now + 3600 }

const data = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`
const sig = b64url(crypto.createHmac('sha256', secret).update(data).digest())
console.log(`${data}.${sig}`)
