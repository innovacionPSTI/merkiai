/**
 * Validación de entrada del control plane (seguridad, HU-202/205).
 * Charset estricto para hostnames y subdominios → evita inyección en filtros
 * PostgREST y valores inválidos en el registro de tenants.
 */

const SUBDOMAIN_RE = /^[a-z0-9-]{2,40}$/
const HOST_RE = /^[a-z0-9.-]{1,253}$/

/** Normaliza un Host: minúsculas, sin espacios ni puerto. */
export function normalizeHost(raw: string): string {
  return String(raw ?? '').trim().toLowerCase().replace(/:\d+$/, '')
}

/** Subdominio válido: a-z, 0-9, guion; 2–40 chars. */
export function isValidSubdomain(s: string): boolean {
  return SUBDOMAIN_RE.test(s)
}

/** Hostname válido: a-z, 0-9, punto, guion; 1–253 chars. */
export function isValidHost(s: string): boolean {
  return HOST_RE.test(s)
}
