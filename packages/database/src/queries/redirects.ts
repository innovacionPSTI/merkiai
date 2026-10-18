import type { Db } from '../client'

/**
 * Gestor de redirects 301 (HU-113). Reglas origen→destino por tienda que el
 * storefront resuelve en el middleware y el panel gestiona. `db` se pasa por
 * parámetro (RLS por tenant). La validación (loops/duplicados) es pura y
 * testeable; las funciones de BD la reutilizan.
 */

export interface Redirect {
  id: number
  from_path: string
  to_path: string
  status_code: number
  active: boolean
  note: string | null
  created_at: string
  updated_at: string
}

export interface RedirectInput {
  from_path: string
  to_path: string
  status_code?: number
  note?: string | null
}

/**
 * Normaliza una ruta de origen: siempre relativa al sitio, con barra inicial,
 * sin barra final (salvo raíz) ni query/hash. Minúsculas para comparar de forma
 * estable. Devuelve '' si queda vacía o inválida.
 */
export function normalizeFromPath(raw: string): string {
  let p = (raw ?? '').trim()
  if (!p) return ''
  // Quitar origen si pegaron una URL absoluta.
  p = p.replace(/^https?:\/\/[^/]+/i, '')
  // Cortar query/hash.
  p = p.split('#')[0].split('?')[0]
  if (!p.startsWith('/')) p = '/' + p
  // Colapsar barras y quitar barra final (salvo raíz).
  p = p.replace(/\/{2,}/g, '/')
  if (p.length > 1) p = p.replace(/\/+$/, '')
  return p.toLowerCase()
}

/**
 * Normaliza el destino. Admite URL absoluta (http/https) tal cual; si es
 * relativa, aplica la misma normalización que el origen pero conserva mayúsculas
 * (puede importar en destinos externos) y permite query/hash.
 */
export function normalizeToPath(raw: string): string {
  const p = (raw ?? '').trim()
  if (!p) return ''
  if (/^https?:\/\//i.test(p)) return p
  let rel = p
  if (!rel.startsWith('/')) rel = '/' + rel
  rel = rel.replace(/\/{2,}/g, '/')
  return rel
}

export interface RedirectValidation {
  ok: boolean
  error?: string
  from_path: string
  to_path: string
  status_code: number
}

/**
 * Valida y normaliza una regla. `existing` son las reglas ya guardadas del
 * tenant (para detectar duplicados y loops simples). `editingId` excluye la
 * propia regla al editar.
 */
export function validateRedirect(
  input: RedirectInput,
  existing: Array<Pick<Redirect, 'id' | 'from_path' | 'to_path'>> = [],
  editingId?: number,
): RedirectValidation {
  const from_path = normalizeFromPath(input.from_path)
  const to_path = normalizeToPath(input.to_path)
  const status_code = input.status_code === 302 ? 302 : 301
  const base = { from_path, to_path, status_code }

  if (!from_path) return { ok: false, error: 'La ruta de origen es obligatoria.', ...base }
  if (!to_path) return { ok: false, error: 'El destino es obligatorio.', ...base }
  if (from_path === normalizeFromPath(to_path) && !/^https?:\/\//i.test(to_path)) {
    return { ok: false, error: 'El origen y el destino no pueden ser iguales.', ...base }
  }

  const others = existing.filter((r) => r.id !== editingId)
  if (others.some((r) => r.from_path === from_path)) {
    return { ok: false, error: `Ya existe una regla para ${from_path}.`, ...base }
  }
  // Loop directo: existe una regla destino→origen que devolvería al punto de partida.
  const toAsFrom = normalizeFromPath(to_path)
  if (others.some((r) => r.from_path === toAsFrom && r.to_path === from_path)) {
    return { ok: false, error: 'Esta regla crearía un bucle de redirección.', ...base }
  }

  return { ok: true, ...base }
}

/** Lista todas las reglas del tenant (panel). */
export async function listRedirects(db: Db): Promise<Redirect[]> {
  const { data } = await db
    .from('redirects')
    .select('id, from_path, to_path, status_code, active, note, created_at, updated_at')
    .order('created_at', { ascending: false })
  return (data ?? []) as Redirect[]
}

/** Solo las reglas activas (resolución en el storefront). */
export async function listActiveRedirects(db: Db): Promise<Redirect[]> {
  const { data } = await db
    .from('redirects')
    .select('id, from_path, to_path, status_code, active, note, created_at, updated_at')
    .eq('active', true)
  return (data ?? []) as Redirect[]
}

/** Resuelve una ruta a su destino activo, o null si no hay regla. */
export function resolveRedirect(
  path: string,
  rules: Array<Pick<Redirect, 'from_path' | 'to_path' | 'status_code'>>,
): { to_path: string; status_code: number } | null {
  const from = normalizeFromPath(path)
  const hit = rules.find((r) => r.from_path === from)
  return hit ? { to_path: hit.to_path, status_code: hit.status_code } : null
}

/** Crea una regla validada. Lanza Error con mensaje legible si es inválida. */
export async function createRedirect(input: RedirectInput, db: Db, tenantId: string): Promise<Redirect> {
  const existing = await listRedirects(db)
  const v = validateRedirect(input, existing)
  if (!v.ok) throw new Error(v.error)
  const { data, error } = await db
    .from('redirects')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({ tenant_id: tenantId, from_path: v.from_path, to_path: v.to_path, status_code: v.status_code, note: input.note ?? null } as any)
    .select('id, from_path, to_path, status_code, active, note, created_at, updated_at')
    .single()
  if (error) throw error
  return data as Redirect
}

/** Alta best-effort de un redirect por cambio de slug (AC-3). Nunca lanza:
 * si la regla ya existe o es inválida, se ignora silenciosamente. */
export async function suggestRedirectOnSlugChange(
  fromPath: string,
  toPath: string,
  db: Db,
  tenantId: string,
): Promise<void> {
  try {
    const from_path = normalizeFromPath(fromPath)
    const to_path = normalizeToPath(toPath)
    if (!from_path || !to_path || from_path === normalizeFromPath(to_path)) return
    await db
      .from('redirects')
      // upsert idempotente por (tenant, from_path); si ya hay regla manual, no la pisa
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .upsert({ tenant_id: tenantId, from_path, to_path, status_code: 301, active: true, note: 'Auto: cambio de slug' } as any, { onConflict: 'tenant_id,from_path', ignoreDuplicates: true })
  } catch {
    // best-effort: no debe tumbar la operación que la origina
  }
}

export async function setRedirectActive(id: number, active: boolean, db: Db): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await db.from('redirects').update({ active, updated_at: new Date().toISOString() } as any).eq('id', id)
  if (error) throw error
}

export async function deleteRedirect(id: number, db: Db): Promise<void> {
  const { error } = await db.from('redirects').delete().eq('id', id)
  if (error) throw error
}
