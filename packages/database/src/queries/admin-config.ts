import { createServerClient, type Db } from '../client'

export interface AdminConfig {
  id: number
  /** Color hex del acento (botones, nav activo, links). Ej: '#4F46E5' */
  accent_color: string
  /** Color hex de fondo del sidebar. Ej: '#0F172A' */
  sidebar_color: string
  updated_at: string
}

export type UpdateAdminConfigInput = Partial<Pick<AdminConfig, 'accent_color' | 'sidebar_color'>>

/** Tenant por defecto (config por-tenant, HU-207). */
const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001'

const DEFAULT_ADMIN_CONFIG: AdminConfig = {
  id: 1,
  accent_color: '#4F46E5',
  sidebar_color: '#0F172A',
  updated_at: new Date().toISOString(),
}

export async function getAdminConfig(db: Db = createServerClient(), tenantId: string = DEFAULT_TENANT_ID): Promise<AdminConfig> {
  const supabase = db
  const { data, error } = await supabase
    .from('admin_config')
    .select('*')
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (error || !data) return DEFAULT_ADMIN_CONFIG
  return data as AdminConfig
}

export async function updateAdminConfig(input: UpdateAdminConfigInput, db: Db = createServerClient(), tenantId: string = DEFAULT_TENANT_ID): Promise<AdminConfig> {
  const supabase = db
  const { data, error } = await supabase
    .from('admin_config')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .upsert({ tenant_id: tenantId, ...input, updated_at: new Date().toISOString() } as any, { onConflict: 'tenant_id' })
    .select()
    .single()

  if (error) throw error
  return data as AdminConfig
}
