/**
 * Verificación de propiedad de dominio propio (HU-174). Puro y testeable: sin
 * DNS ni red. El flujo lo orquesta el control plane:
 *   1) el comerciante pide su dominio desde el admin → `pending` + token;
 *   2) publica un registro TXT con el token (prueba de propiedad);
 *   3) el control plane resuelve el TXT y, si coincide, marca `verified` y recién
 *      entonces activa `primary_domain` (anti-hijack de callbacks).
 *
 * Aquí viven solo las reglas puras: normalización, validez, token, el registro
 * TXT esperado y la comprobación contra los registros resueltos.
 */

export type DomainStatus = 'none' | 'pending' | 'verified' | 'active'

/** Normaliza: minúsculas, sin esquema, sin ruta, sin puerto, sin punto final ni 'www.'. */
export function normalizeDomain(input: string): string {
  let d = (input ?? '').trim().toLowerCase()
  d = d.replace(/^[a-z]+:\/\//, '')   // quita http(s)://
  d = d.replace(/\/.*$/, '')          // quita ruta
  d = d.replace(/:\d+$/, '')          // quita puerto
  d = d.replace(/\.$/, '')            // quita punto final (FQDN absoluto)
  d = d.replace(/^www\./, '')         // normaliza apex
  return d
}

const DOMAIN_RE =
  /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/

/** ¿Es un dominio (FQDN) válido? Rechaza dominios de la propia plataforma. */
export function isValidDomain(input: string): boolean {
  const d = normalizeDomain(input)
  if (!DOMAIN_RE.test(d)) return false
  if (d === 'merkiai.com' || d.endsWith('.merkiai.com')) return false // subdominio propio, no "dominio propio"
  return true
}

/** Token de verificación opaco (hex). `rng` inyectable para tests. */
export function makeVerifyToken(rng: () => number = Math.random): string {
  let t = ''
  while (t.length < 32) t += Math.floor(rng() * 0x100000000).toString(16).padStart(8, '0')
  return t.slice(0, 32)
}

/** Nombre del registro TXT que el comerciante debe crear. */
export function expectedTxtName(domain: string): string {
  return `_merkiai-verify.${normalizeDomain(domain)}`
}

/** Valor del registro TXT esperado. */
export function expectedTxtValue(token: string): string {
  return `merkiai-domain-verification=${token}`
}

/**
 * ¿Alguno de los registros TXT resueltos prueba la propiedad?
 * `records` puede venir como strings o como fragmentos (p. ej. dns.resolveTxt
 * devuelve `string[][]`); se normaliza uniendo fragmentos y recortando espacios.
 */
export function verifyTxt(records: Array<string | string[]>, token: string): boolean {
  const expected = expectedTxtValue(token)
  return records
    .map((r) => (Array.isArray(r) ? r.join('') : r).trim())
    .some((v) => v === expected)
}
