#!/usr/bin/env node
/**
 * HU-364 · Guard de variables de entorno. Falla si una app lee `process.env.X`
 * y X no está documentada en su `.env.example` (aunque sea comentada), para que
 * no reaparezcan variables sin dueño ni se cuelen muertas. También cubre las que
 * leen los packages compartidos (se exigen en toda app que los consume).
 *
 * Uso: node scripts/check-env-docs.mjs   (exit 1 si hay faltantes)
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const APPS = ['web', 'admin', 'console']
// Inyectadas por la plataforma/runtime o solo de test: no se documentan.
const IGNORE = new Set(['NODE_ENV', 'NEXT_RUNTIME', 'VERCEL_ENV', 'VERCEL_URL', 'CI', 'JEST_WORKER_ID'])
// Alias retrocompatible en retiro (HU-364): documentado como CONSOLE_URL.
const ALIASES = { CONTROL_PLANE_URL: 'CONSOLE_URL' }
// Leídas por el SDK de AWS (no vía process.env en nuestro código) → solo console.
const RE = /process\.env\.([A-Z][A-Z0-9_]*)/g

function walk(dir, out = []) {
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next' || name === '__tests__' || name === 'dist') continue
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.(ts|tsx|mjs|js)$/.test(name) && !/\.test\./.test(name)) out.push(p)
  }
  return out
}
function used(dir) {
  const set = new Set()
  for (const f of walk(dir)) for (const m of readFileSync(f, 'utf8').matchAll(RE)) set.add(m[1])
  return set
}

const shared = new Set([...used(join(ROOT, 'packages/database/src')), ...used(join(ROOT, 'packages/tenancy/src'))])
let missing = 0
for (const app of APPS) {
  const example = readFileSync(join(ROOT, `apps/${app}/.env.example`), 'utf8')
  const documented = (v) => new RegExp(`^\\s*#?\\s*${v}=`, 'm').test(example)
  const vars = new Set([...used(join(ROOT, `apps/${app}/src`)), ...(app === 'console' ? [] : shared)])
  for (const raw of [...vars].sort()) {
    if (IGNORE.has(raw)) continue
    const v = ALIASES[raw] ?? raw
    if (!documented(v)) { console.error(`✗ apps/${app}: ${raw} se usa en código pero no está en .env.example`); missing++ }
  }
}
if (missing) { console.error(`\n${missing} variable(s) sin documentar. Añádelas a .env.example (y a docs/ENV-VARS-MATRIZ.md).`); process.exit(1) }
console.log('✓ Todas las variables de entorno usadas están documentadas en los .env.example')
