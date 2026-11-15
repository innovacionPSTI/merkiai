#!/usr/bin/env node
/**
 * HU-460 AC-6 · Guard de traducciones (E28 · ADR-011).
 *
 * Falla (exit 1) si:
 *   1. Un mensaje de cualquier catálogo tiene sintaxis ICU inválida.
 *   2. Un catálogo tiene claves que no existen en el de referencia (`es`): claves huérfanas.
 *   3. El código usa una clave que no existe en el catálogo de referencia.
 *
 * Además publica la COBERTURA por idioma (no falla: un idioma incompleto cae a la
 * referencia en runtime). Uso: `pnpm i18n:check` (o `node scripts/check-i18n.mjs`).
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const require = createRequire(import.meta.url)
const ts = require('typescript')
const I18N = join(ROOT, 'packages/i18n/src')
const REFERENCE = 'es'

/** Carga un módulo TS sin dependencias de runtime (transpila a CJS y lo evalúa). */
function loadTs(file) {
  const src = readFileSync(file, 'utf8')
  const { outputText } = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } })
  const module = { exports: {} }
  new Function('module', 'exports', 'require', outputText)(module, module.exports, require)
  return module.exports
}

function flatten(tree, prefix = '', out = new Map()) {
  for (const [k, v] of Object.entries(tree)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (typeof v === 'string') out.set(key, v)
    else flatten(v, key, out)
  }
  return out
}

const { parseMessage } = loadTs(join(I18N, 'icu.ts'))
const catalogs = {}
for (const name of readdirSync(join(I18N, 'catalogs'))) {
  if (!name.endsWith('.ts') || name === 'index.ts') continue
  catalogs[basename(name, '.ts')] = flatten(loadTs(join(I18N, 'catalogs', name)).default)
}
const ref = catalogs[REFERENCE]
if (!ref) { console.error(`✗ Falta el catálogo de referencia "${REFERENCE}"`); process.exit(1) }

const errors = []

// 1 + 2 · sintaxis y huérfanas
for (const [tag, msgs] of Object.entries(catalogs)) {
  for (const [key, msg] of msgs) {
    try { parseMessage(msg) } catch (e) { errors.push(`[${tag}] ${key}: sintaxis ICU inválida — ${e.message}`) }
    if (tag !== REFERENCE && !ref.has(key)) errors.push(`[${tag}] ${key}: clave huérfana (no existe en "${REFERENCE}")`)
  }
}

// 3 · claves usadas en el código
function walk(dir, out = []) {
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir)) {
    if (['node_modules', '.next', '__tests__', 'dist', 'catalogs'].includes(name)) continue
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\./.test(name)) out.push(p)
  }
  return out
}
const dirs = ['apps/web/src', 'apps/admin/src', 'apps/console/src', 'packages/database/src', 'packages/ui/src']
const DECL = /(?:const|let)\s+(\w+)\s*=\s*(?:await\s+)?(?:createTranslator|getTranslator|useT)\(([^)]*)\)/g
let usages = 0
for (const file of dirs.flatMap((d) => walk(join(ROOT, d)))) {
  const src = readFileSync(file, 'utf8')
  for (const m of src.matchAll(DECL)) {
    const [, fn, args] = m
    // createTranslator(locale, 'ns') / getTranslator(locale, 'ns') → 2º argumento; useT('ns') → 1º.
    const nsValue = /useT\(/.test(m[0])
      ? (/^\s*['"]([\w.-]+)['"]\s*$/.exec(args)?.[1] ?? null)
      : (/,\s*['"]([\w.-]+)['"]/.exec(args)?.[1] ?? null)
    const call = new RegExp(`(?<![\\w.])${fn}\\(\\s*['"]([\\w.-]+)['"]`, 'g')
    for (const c of src.matchAll(call)) {
      const key = nsValue ? `${nsValue}.${c[1]}` : c[1]
      usages++
      if (!ref.has(key)) errors.push(`${file.replace(ROOT, '')}: clave "${key}" no existe en "${REFERENCE}"`)
    }
  }
}

// Cobertura
console.log(`i18n · ${ref.size} claves en "${REFERENCE}" · ${usages} usos en código`)
for (const [tag, msgs] of Object.entries(catalogs)) {
  if (tag === REFERENCE) continue
  const isRegional = tag.includes('-')
  if (isRegional) console.log(`  ${tag.padEnd(6)} sobrescribe ${msgs.size} clave(s)`)
  else {
    const covered = [...ref.keys()].filter((k) => msgs.has(k)).length
    console.log(`  ${tag.padEnd(6)} cobertura ${((covered / ref.size) * 100).toFixed(1)} % (${covered}/${ref.size})`)
  }
}

if (errors.length) {
  console.error(`\n✗ ${errors.length} problema(s) de traducción:`)
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}
console.log('✓ Catálogos válidos y sin claves faltantes')
