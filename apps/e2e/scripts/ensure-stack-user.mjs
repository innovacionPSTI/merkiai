#!/usr/bin/env node
/**
 * ensure-stack-user.mjs — Crea (idempotente) el usuario admin de prueba en Stack
 * Auth, porque el registro está deshabilitado en el panel (los admin solo se crean
 * por API de servidor). Así el login de las E2E (global-setup) encuentra el usuario.
 *
 * Es tolerante: si faltan las claves de servidor de Stack, avisa y termina 0 para
 * no romper el pipeline (se puede crear el usuario a mano una vez; ver docs).
 *
 * Variables:
 *   E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD        (usuario de prueba)
 *   NEXT_PUBLIC_STACK_API_URL                  (base de la API; default Stack cloud)
 *   NEXT_PUBLIC_HEXCLAVE_PROJECT_ID            (project id)
 *   HEXCLAVE_SECRET_SERVER_KEY                 (clave de SERVIDOR; secreto)
 *   NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY (clave publicable)
 */
const email = process.env.E2E_ADMIN_EMAIL
const password = process.env.E2E_ADMIN_PASSWORD
const apiUrl = (process.env.NEXT_PUBLIC_STACK_API_URL || 'https://api.stack-auth.com').replace(/\/$/, '')
const projectId = process.env.NEXT_PUBLIC_HEXCLAVE_PROJECT_ID
const serverKey = process.env.HEXCLAVE_SECRET_SERVER_KEY
const clientKey = process.env.NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY

function warnAndExit(msg) {
  console.warn(`⚠ ensure-stack-user: ${msg} — omito la creación (créalo a mano una vez; ver docs/E2E-PRUEBAS.md §3).`)
  process.exit(0)
}

if (!email || !password) warnAndExit('faltan E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD')
if (!projectId || !serverKey) warnAndExit('faltan NEXT_PUBLIC_HEXCLAVE_PROJECT_ID / HEXCLAVE_SECRET_SERVER_KEY')

const headers = {
  'content-type': 'application/json',
  'x-stack-access-type': 'server',
  'x-stack-project-id': projectId,
  'x-stack-secret-server-key': serverKey,
  ...(clientKey ? { 'x-stack-publishable-client-key': clientKey } : {}),
}

async function userExists() {
  // La API lista usuarios; filtramos por email. Si el endpoint no soporta el
  // filtro, traemos la primera página y comparamos.
  const url = `${apiUrl}/api/v1/users?primary_email=${encodeURIComponent(email)}&limit=50`
  const res = await fetch(url, { headers })
  if (!res.ok) return false
  const body = await res.json().catch(() => ({}))
  const items = body.items || body.users || []
  return items.some((u) => (u.primary_email || u.email || '').toLowerCase() === email.toLowerCase())
}

async function createUser() {
  const res = await fetch(`${apiUrl}/api/v1/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      primary_email: email,
      primary_email_auth_enabled: true,
      primary_email_verified: true,
      password,
      display_name: 'Admin E2E',
    }),
  })
  if (res.ok) return { ok: true }
  const text = await res.text()
  // Trata el "ya existe" como éxito idempotente.
  if (res.status === 409 || /already|exists|duplicate/i.test(text)) return { ok: true, existed: true }
  return { ok: false, status: res.status, text }
}

try {
  if (await userExists()) {
    console.log(`✓ Stack Auth: el usuario de prueba ${email} ya existe.`)
    process.exit(0)
  }
  const r = await createUser()
  if (r.ok) {
    console.log(`✓ Stack Auth: usuario de prueba ${email} ${r.existed ? 'ya existía' : 'creado'}.`)
    process.exit(0)
  }
  warnAndExit(`la API respondió ${r.status}: ${r.text?.slice(0, 200)}`)
} catch (e) {
  warnAndExit(`error de red: ${e?.message || e}`)
}
