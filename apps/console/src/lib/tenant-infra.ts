/**
 * Capa de datos de la config de infra por-tenant (HU-361 · ADR-007), BD de
 * PLATAFORMA. Solo config NO secreta; los secretos se gestionan con el vault
 * (HU-362). Gestión simple desde la consola — sin JSON ni estructuras complejas.
 */
import { platformDb } from './platform-db'
import type { InfraConfigStatus } from '@merkiai/tenancy'

export const INFRA_STATUSES: InfraConfigStatus[] = ['draft', 'active', 'rotating', 'disabled']

/** Etiqueta legible para cada estado (UI). */
export const INFRA_STATUS_LABEL: Record<InfraConfigStatus, string> = {
  draft: 'Borrador',
  active: 'Activa',
  rotating: 'Rotando',
  disabled: 'Deshabilitada',
}

/** Fila de `tenant_infra_config` + nombre del tenant (para la lista). */
export interface TenantInfraRow {
  tenant_id: string
  tenant_name: string | null
  db_ref: string
  db_url: string
  base_url: string | null
  sentry_dsn: string | null
  region: string | null
  status: InfraConfigStatus
  updated_at: string
}

/** Entrada ya validada, lista para persistir. */
export interface TenantInfraInput {
  tenant_id: string
  db_ref: string
  db_url: string
  base_url: string | null
  sentry_dsn: string | null
  region: string | null
  status: InfraConfigStatus
}

const DB_REF_RE = /^[a-z0-9][a-z0-9-]{1,39}$/

/**
 * Valida los campos del formulario (PURO). Mensajes claros para la UI; nada de
 * JSON. Normaliza vacíos a null.
 */
export function parseInfraForm(raw: {
  tenant_id: string
  db_ref: string
  db_url: string
  base_url: string
  sentry_dsn: string
  region: string
  status: string
}): { ok: true; value: TenantInfraInput } | { ok: false; error: string } {
  const tenant_id = raw.tenant_id.trim()
  if (!tenant_id) return { ok: false, error: 'Selecciona el cliente (tenant).' }

  const db_ref = raw.db_ref.trim().toLowerCase()
  if (db_ref === 'shared') return { ok: false, error: 'La clave de routing no puede ser "shared" (eso es el clúster compartido).' }
  if (!DB_REF_RE.test(db_ref)) return { ok: false, error: 'Clave de routing inválida: 2–40 caracteres a–z, 0–9 o guion.' }

  const db_url = raw.db_url.trim()
  if (!/^https?:\/\/.+/.test(db_url)) return { ok: false, error: 'El endpoint de la base de datos debe ser una URL (https://…).' }

  const status = raw.status.trim() as InfraConfigStatus
  if (!INFRA_STATUSES.includes(status)) return { ok: false, error: 'Estado inválido.' }

  const opt = (v: string) => (v.trim() ? v.trim() : null)
  return {
    ok: true,
    value: {
      tenant_id,
      db_ref,
      db_url,
      base_url: opt(raw.base_url),
      sentry_dsn: opt(raw.sentry_dsn),
      region: opt(raw.region),
      status,
    },
  }
}

/** Lista las configs de infra con el nombre del tenant (join en memoria). */
export async function listTenantInfra(): Promise<TenantInfraRow[]> {
  const db = platformDb()
  const [{ data: cfgs }, { data: tenants }] = await Promise.all([
    db.from('tenant_infra_config')
      .select('tenant_id, db_ref, db_url, base_url, sentry_dsn, region, status, updated_at')
      .order('updated_at', { ascending: false }),
    db.from('tenants').select('id, name'),
  ])
  const nameById = new Map((tenants ?? []).map((t: { id: string; name: string | null }) => [t.id, t.name]))
  return ((cfgs ?? []) as Omit<TenantInfraRow, 'tenant_name'>[]).map((c) => ({
    ...c,
    tenant_name: nameById.get(c.tenant_id) ?? null,
  }))
}

/** Crea o actualiza la config de un tenant (upsert por `tenant_id`). */
export async function upsertTenantInfra(value: TenantInfraInput): Promise<{ error?: string }> {
  const { error } = await platformDb()
    .from('tenant_infra_config')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .upsert({ ...value, updated_at: new Date().toISOString() } as any, { onConflict: 'tenant_id' })
  return { error: error?.message }
}

/** Elimina la config de infra de un tenant. */
export async function deleteTenantInfra(tenantId: string): Promise<void> {
  await platformDb().from('tenant_infra_config').delete().eq('tenant_id', tenantId)
}
