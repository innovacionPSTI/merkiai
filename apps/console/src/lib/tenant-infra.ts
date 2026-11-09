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
  // Indicadores (NO exponen el valor ni la referencia): solo si ya está cargado.
  has_anon_key: boolean
  has_service_key: boolean
  has_jwt_secret: boolean
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

interface InfraCfgRaw {
  tenant_id: string; db_ref: string; db_url: string; base_url: string | null
  sentry_dsn: string | null; region: string | null; status: InfraConfigStatus; updated_at: string
  secret_ref_anon_key: string | null; secret_ref_service_key: string | null; secret_ref_jwt_secret: string | null
}

/** Lista las configs de infra con el nombre del tenant (join en memoria). */
export async function listTenantInfra(): Promise<TenantInfraRow[]> {
  const db = platformDb()
  const [{ data: cfgs }, { data: tenants }] = await Promise.all([
    db.from('tenant_infra_config')
      .select('tenant_id, db_ref, db_url, base_url, sentry_dsn, region, status, updated_at, secret_ref_anon_key, secret_ref_service_key, secret_ref_jwt_secret')
      .order('updated_at', { ascending: false }),
    db.from('tenants').select('id, name'),
  ])
  const nameById = new Map((tenants ?? []).map((t: { id: string; name: string | null }) => [t.id, t.name]))
  return ((cfgs ?? []) as InfraCfgRaw[]).map((c) => ({
    tenant_id: c.tenant_id, db_ref: c.db_ref, db_url: c.db_url, base_url: c.base_url,
    sentry_dsn: c.sentry_dsn, region: c.region, status: c.status, updated_at: c.updated_at,
    tenant_name: nameById.get(c.tenant_id) ?? null,
    has_anon_key: !!c.secret_ref_anon_key,
    has_service_key: !!c.secret_ref_service_key,
    has_jwt_secret: !!c.secret_ref_jwt_secret,
  }))
}

/** Referencias de secreto actuales de un tenant (para rotar vs crear). */
export async function getInfraSecretRefs(tenantId: string): Promise<{
  anon: string | null; service: string | null; jwt: string | null
}> {
  const { data } = await platformDb()
    .from('tenant_infra_config')
    .select('secret_ref_anon_key, secret_ref_service_key, secret_ref_jwt_secret')
    .eq('tenant_id', tenantId)
    .maybeSingle()
  return {
    anon: data?.secret_ref_anon_key ?? null,
    service: data?.secret_ref_service_key ?? null,
    jwt: data?.secret_ref_jwt_secret ?? null,
  }
}

/** Fija las referencias de secreto (columnas secret_ref_*) de un tenant. */
export async function setInfraSecretRefs(
  tenantId: string,
  refs: { anon?: string; service?: string; jwt?: string },
): Promise<{ error?: string }> {
  const patch: Record<string, string> = {}
  if (refs.anon) patch.secret_ref_anon_key = refs.anon
  if (refs.service) patch.secret_ref_service_key = refs.service
  if (refs.jwt) patch.secret_ref_jwt_secret = refs.jwt
  if (Object.keys(patch).length === 0) return {}
  const { error } = await platformDb()
    .from('tenant_infra_config')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('tenant_id', tenantId)
  return { error: error?.message }
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
