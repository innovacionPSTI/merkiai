import type { Db } from '../client'

/**
 * Registro de emails transaccionales (HU-162). `recordEmail` es best-effort
 * (NUNCA lanza: registrar no debe tumbar el flujo que lo origina) y reemplaza
 * los `.catch` mudos. `listEmailLog` pagina para el admin. `db` por parámetro
 * (RLS por tenant / is_admin).
 */

export interface EmailLogInput {
  tenantId: string
  to: string
  type: string
  provider?: string | null
  status: 'sent' | 'failed' | 'suppressed'
  entity?: string | null
  error?: string | null
}

export async function recordEmail(db: Db, input: EmailLogInput): Promise<void> {
  try {
    await db.from('email_log').insert({
      tenant_id: input.tenantId,
      to_email: input.to,
      type: input.type,
      provider: input.provider ?? null,
      status: input.status,
      entity: input.entity ?? null,
      error: input.error ? String(input.error).slice(0, 500) : null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
  } catch {
    /* best-effort: el log de correo nunca bloquea el envío/pedido */
  }
}

/**
 * Idempotencia por (tenant, tipo, entidad): devuelve true si ya existe un envío
 * `sent` para esa combinación (p. ej. no reenviar la confirmación de un pedido
 * cuando el webhook se reintenta). Best-effort: ante error devuelve false para
 * no bloquear un envío legítimo.
 */
export async function alreadySentEmail(
  db: Db,
  key: { tenantId: string; type: string; entity: string | null | undefined },
): Promise<boolean> {
  if (!key.entity) return false
  try {
    const { count } = await db
      .from('email_log')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', key.tenantId)
      .eq('type', key.type)
      .eq('entity', key.entity)
      .eq('status', 'sent')
    return (count ?? 0) > 0
  } catch {
    return false
  }
}

/**
 * Reintenta una operación asíncrona (envío de correo) con backoff exponencial.
 * `attempts` = nº total de intentos (1 = sin reintento). Lanza el último error.
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  opts: { attempts?: number; baseDelayMs?: number; sleep?: (ms: number) => Promise<void> } = {},
): Promise<T> {
  const attempts = Math.max(1, opts.attempts ?? 3)
  const base = opts.baseDelayMs ?? 300
  const sleep = opts.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)))
  let lastErr: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (e) {
      lastErr = e
      if (i < attempts - 1) await sleep(base * Math.pow(2, i))
    }
  }
  throw lastErr
}

export interface EmailLogEntry {
  id: number
  to_email: string
  type: string
  provider: string | null
  status: string
  entity: string | null
  error: string | null
  created_at: string
}

export async function listEmailLog(
  db: Db,
  opts: { limit?: number; offset?: number; type?: string } = {},
): Promise<{ entries: EmailLogEntry[]; total: number }> {
  const limit = Math.min(Math.max(1, opts.limit ?? 50), 200)
  const offset = Math.max(0, opts.offset ?? 0)
  let q = db.from('email_log').select('id, to_email, type, provider, status, entity, error, created_at', { count: 'exact' })
  if (opts.type) q = q.eq('type', opts.type)
  const { data, count } = await q.order('created_at', { ascending: false }).range(offset, offset + limit - 1)
  return { entries: (data ?? []) as EmailLogEntry[], total: count ?? 0 }
}
