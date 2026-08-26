/**
 * PoC HU-171 — Genera un JWT de Supabase con el claim tenant_id para la prueba
 * manual de RLS (ver README §"Validar contra Supabase real").
 *
 * Uso:
 *   SUPABASE_JWT_SECRET="<jwt secret del proyecto>" \
 *   node poc/mint-jwt.mjs <tenant_id> [user_id]
 *
 * Ejemplo:
 *   SUPABASE_JWT_SECRET="super-secret..." node poc/mint-jwt.mjs 11111111-1111-1111-1111-111111111111 user-a
 */
import { SignJWT } from 'jose'

const secret = process.env.SUPABASE_JWT_SECRET
const tenantId = process.argv[2]
const userId = process.argv[3] || 'poc-user'

if (!secret) { console.error('Falta SUPABASE_JWT_SECRET'); process.exit(1) }
if (!tenantId) { console.error('Uso: node poc/mint-jwt.mjs <tenant_id> [user_id]'); process.exit(1) }

const token = await new SignJWT({ role: 'authenticated', tenant_id: tenantId })
  .setProtectedHeader({ alg: 'HS256' })
  .setSubject(userId)
  .setAudience('authenticated')
  .setIssuedAt()
  .setExpirationTime('1h')
  .sign(new TextEncoder().encode(secret))

console.log(token)
