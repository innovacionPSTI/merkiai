import type { Db } from '../client'
import type { AuditLogEntry } from '../types'

/**
 * Registro de auditoría (HU-146). Traza append-only de operaciones sensibles del
 * panel. `logAudit` NUNCA lanza: la auditoría no debe tumbar la operación que la
 * origina. `db` se pasa por parámetro (RLS por tenant / is_admin).
 */

export interface AuditInput {
  tenantId: string
  actorEmail?: string | null
  actorRole?: string | null
  /** Acción tipada, p. ej. 'data.export', 'order.status', 'return.resolve'. */
  action: string
  entity?: string | null
  entityId?: string | number | null
  summary?: string | null
  metadata?: Record<string, unknown>
}

/** Inserta una entrada de auditoría. Best-effort: no lanza ante errores. */
export async function logAudit(db: Db, input: AuditInput): Promise<void> {
  try {
    await db.from('audit_log').insert({
      tenant_id: input.tenantId,
      actor_email: input.actorEmail ?? null,
      actor_role: input.actorRole ?? null,
      action: input.action,
      entity: input.entity ?? null,
      entity_id: input.entityId != null ? String(input.entityId) : null,
      summary: input.summary ?? null,
      metadata: input.metadata ?? {},
    })
  } catch (e) {
    console.error('[audit] logAudit error:', e instanceof Error ? e.message : e)
  }
}

export interface ListAuditOptions {
  action?: string
  entity?: string
  limit?: number
  offset?: number
}

/** Lista entradas de auditoría (más recientes primero) + total, con filtros. */
export async function listAudit(db: Db, opts: ListAuditOptions = {}): Promise<{ entries: AuditLogEntry[]; total: number }> {
  const limit = Math.min(100, Math.max(1, opts.limit ?? 50))
  const offset = Math.max(0, opts.offset ?? 0)
  let q = db.from('audit_log').select('*', { count: 'exact' }).order('created_at', { ascending: false })
  if (opts.action) q = q.eq('action', opts.action)
  if (opts.entity) q = q.eq('entity', opts.entity)
  q = q.range(offset, offset + limit - 1)
  const { data, count } = await q
  return { entries: (data ?? []) as AuditLogEntry[], total: count ?? 0 }
}
