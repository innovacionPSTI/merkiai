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
