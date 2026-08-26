/**
 * Otorga (o revoca) el permiso de plataforma `platform:operate` a un operador
 * del control plane. Usa la REST API de Stack Auth directamente (fetch nativo),
 * sin el SDK — evita el acople a Next del paquete @stackframe/stack en Node.
 *
 * Requisitos previos (una sola vez):
 *   - Crear la Project Permission `platform:operate` en Stack Auth
 *     (RBAC → Project Permissions) del proyecto del console.
 *   - Env del console cargados (usa --env-file=.env.local).
 *
 * Uso:
 *   node --env-file=.env.local scripts/grant-operator.mjs operador@tu.com
 *   node --env-file=.env.local scripts/grant-operator.mjs operador@tu.com --revoke
 *   node --env-file=.env.local scripts/grant-operator.mjs --list
 */

const PERMISSION = 'platform:operate'
const BASE = (process.env.STACK_API_URL ?? 'https://api.stack-auth.com') + '/api/v1'

function assertEnv() {
  const missing = ['NEXT_PUBLIC_HEXCLAVE_PROJECT_ID', 'NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY', 'HEXCLAVE_SECRET_SERVER_KEY']
    .filter((k) => !process.env[k])
  if (missing.length) {
    console.error(`❌ Faltan variables de entorno: ${missing.join(', ')}`)
    console.error('   Ejecuta con: node --env-file=.env.local scripts/grant-operator.mjs ...')
    process.exit(1)
  }
}

const headers = () => ({
  'X-Stack-Access-Type': 'server',
  'X-Stack-Project-Id': process.env.NEXT_PUBLIC_HEXCLAVE_PROJECT_ID,
  'X-Stack-Publishable-Client-Key': process.env.NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY,
  'X-Stack-Secret-Server-Key': process.env.HEXCLAVE_SECRET_SERVER_KEY,
  'Content-Type': 'application/json',
})

async function api(method, path) {
  const init = { method, headers: headers() }
  if (method === 'POST' || method === 'PATCH') init.body = '{}' // el endpoint exige cuerpo JSON
  const res = await fetch(`${BASE}${path}`, init)
  const text = await res.text()
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text}`)
  return text ? JSON.parse(text) : null
}

async function listUsers() {
  const data = await api('GET', '/users?limit=200')
  return data?.items ?? []
}

async function main() {
  assertEnv()
  const args = process.argv.slice(2)
  const revoke = args.includes('--revoke')
  const list = args.includes('--list')
  const email = args.find((a) => !a.startsWith('--'))

  if (list) {
    const users = await listUsers()
    console.log(`Usuarios del proyecto console (${users.length}):`)
    for (const u of users) console.log(` - ${u.primary_email ?? '(sin email)'}  ·  ${u.id}`)
    return
  }

  if (!email) {
    console.error('❌ Indica el email del operador. Ej: scripts/grant-operator.mjs operador@tu.com')
    console.error('   (o usa --list para ver los usuarios)')
    process.exit(1)
  }

  const users = await listUsers()
  const user = users.find((u) => u.primary_email?.toLowerCase() === email.toLowerCase())
  if (!user) {
    console.error(`❌ No existe un usuario con email ${email} en el proyecto del console.`)
    console.error('   Debe registrarse primero en /login del console.')
    process.exit(1)
  }

  const path = `/project-permissions/${user.id}/${PERMISSION}`
  if (revoke) {
    await api('DELETE', path)
    console.log(`🚫 ${PERMISSION} REVOCADO → ${email} (${user.id})`)
  } else {
    await api('POST', path)
    console.log(`✅ ${PERMISSION} otorgado → ${email} (${user.id})`)
  }
}

main().catch((err) => {
  console.error('❌ Error:', err?.message ?? err)
  process.exit(1)
})
