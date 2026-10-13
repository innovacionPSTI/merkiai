/**
 * Capa de datos de instancias de integración (ADR-004 · HU-275).
 *
 * Cada fila es UNA configuración de un proveedor (pago/envío/correo). Permite
 * varias del mismo proveedor con etiqueta interna, conservando "una activa por
 * (tenant, kind)". Los secretos viven en `credentials` (jsonb); el acceso está
 * acotado por RLS (is_admin + tenant). Nadie lo consume aún (ver HU-276/277).
 */
import type { Db } from '../client'
import type { Database } from '../types'

export type IntegrationKind = 'payment' | 'shipping' | 'email'
export type IntegrationEnv = 'test' | 'production'

type Row = Database['public']['Tables']['integration_instances']['Row']

export interface IntegrationInstance {
  id: string
  tenantId: string
  kind: IntegrationKind
  provider: string
  label: string | null
  environment: IntegrationEnv
  credentials: Record<string, unknown>
  settings: Record<string, unknown>
  enabled: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateInstanceInput {
  tenantId: string
  kind: IntegrationKind
  provider: string
  label?: string | null
  environment?: IntegrationEnv
  credentials?: Record<string, unknown>
  settings?: Record<string, unknown>
  enabled?: boolean
}

export interface UpdateInstanceInput {
  provider?: string
  label?: string | null
  environment?: IntegrationEnv
  /** Se MERGEA con lo existente (no se sobreescriben secretos no enviados). */
  credentials?: Record<string, unknown>
  settings?: Record<string, unknown>
  enabled?: boolean
}

function toModel(r: Row): IntegrationInstance {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    kind: r.kind,
    provider: r.provider,
    label: r.label,
    environment: r.environment,
    credentials: r.credentials ?? {},
    settings: r.settings ?? {},
    enabled: r.enabled,
    isActive: r.is_active,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

/** Lista las instancias de un tenant para un tipo (pago/envío/correo). */
export async function listInstances(db: Db, tenantId: string, kind: IntegrationKind): Promise<IntegrationInstance[]> {
  const { data, error } = await db
    .from('integration_instances')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('kind', kind)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map((r) => toModel(r as Row))
}

/** Devuelve la instancia ACTIVA de un tipo (o null) — fuente de verdad del runtime. */
export async function getActiveInstance(db: Db, tenantId: string, kind: IntegrationKind): Promise<IntegrationInstance | null> {
  const { data, error } = await db
    .from('integration_instances')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('kind', kind)
    .eq('is_active', true)
    .maybeSingle()
  if (error) throw error
  return data ? toModel(data as Row) : null
}

export async function createInstance(db: Db, input: CreateInstanceInput): Promise<IntegrationInstance> {
  const { data, error } = await db
    .from('integration_instances')
    .insert({
      tenant_id: input.tenantId,
      kind: input.kind,
      provider: input.provider,
      label: input.label ?? null,
      environment: input.environment ?? 'test',
      credentials: input.credentials ?? {},
      settings: input.settings ?? {},
      enabled: input.enabled ?? true,
    })
    .select('*')
    .single()
  if (error) throw error
  return toModel(data as Row)
}

export async function updateInstance(db: Db, tenantId: string, id: string, patch: UpdateInstanceInput): Promise<IntegrationInstance> {
  // Merge de credentials/settings para no borrar secretos no reenviados.
  const current = await db
    .from('integration_instances')
    .select('credentials, settings')
    .eq('tenant_id', tenantId)
    .eq('id', id)
    .maybeSingle()
  const curCreds = (current.data?.credentials as Record<string, unknown> | undefined) ?? {}
  const curSettings = (current.data?.settings as Record<string, unknown> | undefined) ?? {}

  const payload: Database['public']['Tables']['integration_instances']['Update'] = {}
  if (patch.provider !== undefined) payload.provider = patch.provider
  if (patch.label !== undefined) payload.label = patch.label
  if (patch.environment !== undefined) payload.environment = patch.environment
  if (patch.enabled !== undefined) payload.enabled = patch.enabled
  if (patch.credentials !== undefined) payload.credentials = { ...curCreds, ...patch.credentials }
  if (patch.settings !== undefined) payload.settings = { ...curSettings, ...patch.settings }

  const { data, error } = await db
    .from('integration_instances')
    .update(payload)
    .eq('tenant_id', tenantId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return toModel(data as Row)
}

export async function removeInstance(db: Db, tenantId: string, id: string): Promise<void> {
  const { error } = await db
    .from('integration_instances')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('id', id)
  if (error) throw error
}

/**
 * Marca una instancia como la activa de su (tenant, kind). Desactiva primero las
 * demás para respetar el índice único parcial de `is_active`. Pasa `null` para
 * dejar ninguna activa (→ el runtime cae a su modo por defecto, p. ej. manual).
 */
export async function setActiveInstance(db: Db, tenantId: string, kind: IntegrationKind, id: string | null): Promise<void> {
  const off = await db
    .from('integration_instances')
    .update({ is_active: false })
    .eq('tenant_id', tenantId)
    .eq('kind', kind)
    .eq('is_active', true)
  if (off.error) throw off.error
  if (!id) return
  const on = await db
    .from('integration_instances')
    .update({ is_active: true })
    .eq('tenant_id', tenantId)
    .eq('id', id)
  if (on.error) throw on.error
}
