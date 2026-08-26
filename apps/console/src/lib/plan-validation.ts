/**
 * Validación pura de planes (HU-173). Sin dependencias de red/DB → testeable.
 */
export const PLAN_KEY_RE = /^[a-z0-9-]{2,30}$/
export const DATA_ISOLATION = ['shared', 'schema', 'dedicated'] as const
export type DataIsolation = (typeof DATA_ISOLATION)[number]

export interface PlanInput {
  key: string
  name: string
  price_cents: number
  currency: string
  features: Record<string, unknown>
  limits: Record<string, unknown>
  data_isolation: DataIsolation
  active: boolean
}

/** Parsea un objeto JSON plano; '' → {}. Devuelve null si es inválido o no-objeto. */
export function parseJsonObject(raw: string | undefined | null): Record<string, unknown> | null {
  if (!raw || !raw.trim()) return {}
  try {
    const v = JSON.parse(raw)
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
  } catch {
    return null
  }
}

export interface PlanFormFields {
  key?: string
  name?: string
  price_cents?: string
  currency?: string
  features?: string
  limits?: string
  data_isolation?: string
  active?: string
}

/** Valida y normaliza el formulario de plan. */
export function parsePlanForm(
  f: PlanFormFields,
): { ok: true; value: PlanInput } | { ok: false; error: string } {
  const key = (f.key ?? '').trim().toLowerCase()
  if (!PLAN_KEY_RE.test(key)) return { ok: false, error: 'key inválida (a-z, 0-9, -, 2-30)' }

  const name = (f.name ?? '').trim()
  if (!name) return { ok: false, error: 'nombre requerido' }

  const price_cents = Number.parseInt(f.price_cents ?? '0', 10)
  if (!Number.isFinite(price_cents) || price_cents < 0) return { ok: false, error: 'precio inválido' }

  const features = parseJsonObject(f.features)
  if (!features) return { ok: false, error: 'features debe ser un objeto JSON' }

  const limits = parseJsonObject(f.limits)
  if (!limits) return { ok: false, error: 'limits debe ser un objeto JSON' }

  const di = (f.data_isolation ?? 'shared') as DataIsolation
  if (!DATA_ISOLATION.includes(di)) return { ok: false, error: 'aislamiento inválido' }

  return {
    ok: true,
    value: {
      key,
      name,
      price_cents,
      currency: ((f.currency ?? 'COP').trim() || 'COP').toUpperCase(),
      features,
      limits,
      data_isolation: di,
      active: f.active !== 'false',
    },
  }
}
