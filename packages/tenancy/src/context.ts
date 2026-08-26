/**
 * Resolución y aserción del contexto de tenant.
 *
 * El tenant se resuelve por host (subdominio/dominio propio) contra el registro
 * de la BD de plataforma. Sin contexto de tenant válido, las operaciones se
 * rechazan (fail-closed) — nunca se ejecuta una query sin tenant.
 */
import type { TenantContext, TenantRecord } from './types'

/** Error de contexto ausente (fail-closed). */
export class MissingTenantContextError extends Error {
  constructor(message = 'Contexto de tenant ausente o inválido') {
    super(`[tenancy] ${message}`)
    this.name = 'MissingTenantContextError'
  }
}

/**
 * Resolvedor de tenant por host. En producción lo implementa el control plane
 * (consulta/caché de `host → tenant`). Se inyecta como dependencia para no
 * acoplar el plano de tienda a la BD de plataforma (inversión de dependencias).
 */
export interface TenantResolver {
  resolveByHost(host: string): Promise<TenantRecord | null>
}

/** Normaliza un Host header a un hostname en minúsculas y sin puerto. */
export function normalizeHost(host: string): string {
  return String(host || '')
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, '')
}

/**
 * Resuelve el `TenantRecord` a partir del Host. Fail-closed: lanza si el host
 * no mapea a ningún tenant.
 */
export async function resolveTenantByHost(
  host: string,
  resolver: TenantResolver,
): Promise<TenantRecord> {
  const normalized = normalizeHost(host)
  if (!normalized) throw new MissingTenantContextError('Host vacío')
  const tenant = await resolver.resolveByHost(normalized)
  if (!tenant) throw new MissingTenantContextError(`Host no asociado a un tenant: ${normalized}`)
  return tenant
}

/**
 * Garantiza que exista un contexto de tenant completo antes de tocar datos.
 * Fail-closed: lanza `MissingTenantContextError` si falta `tenantId` o `userId`.
 */
export function assertTenantContext(
  ctx: Partial<TenantContext> | null | undefined,
): TenantContext {
  if (!ctx || !ctx.tenantId || !ctx.userId) {
    throw new MissingTenantContextError()
  }
  return { tenantId: ctx.tenantId, userId: ctx.userId }
}
