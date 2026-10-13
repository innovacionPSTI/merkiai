/**
 * Enmascara una instancia de integración para el cliente (ADR-004 · HU-276).
 * Nunca envía valores de secretos: los campos `type:'secret'` del registry se
 * reemplazan por un flag `secretSet[key]` (si ya hay valor). Los campos de texto
 * se envían tal cual. Incluye `settings` no sensibles.
 */
import type { IntegrationInstance, ProviderDef } from '@merkiai/database'

export interface MaskedInstance {
  id: string
  provider: string
  label: string | null
  environment: 'test' | 'production'
  enabled: boolean
  isActive: boolean
  /** Valores NO secretos (campos type:'text'). */
  values: Record<string, string>
  /** ¿Cada secreto ya tiene valor guardado? */
  secretSet: Record<string, boolean>
  settings: Record<string, unknown>
}

export function maskInstance(inst: IntegrationInstance, def: ProviderDef | undefined): MaskedInstance {
  const values: Record<string, string> = {}
  const secretSet: Record<string, boolean> = {}
  const creds = inst.credentials ?? {}
  for (const f of def?.fields ?? []) {
    const v = creds[f.key]
    if (f.type === 'secret') secretSet[f.key] = !!v
    else if (typeof v === 'string') values[f.key] = v
  }
  return {
    id: inst.id,
    provider: inst.provider,
    label: inst.label,
    environment: inst.environment,
    enabled: inst.enabled,
    isActive: inst.isActive,
    values,
    secretSet,
    settings: inst.settings ?? {},
  }
}

/** Subconjunto serializable del registry para el cliente (sin funciones). */
export interface PublicProviderDef {
  provider: string
  label: string
  description: string
  fields: ProviderDef['fields']
  requiredKeys: string[]
}

export function publicProviders(defs: ProviderDef[]): PublicProviderDef[] {
  return defs.map((d) => ({ provider: d.provider, label: d.label, description: d.description, fields: d.fields, requiredKeys: d.requiredKeys }))
}
