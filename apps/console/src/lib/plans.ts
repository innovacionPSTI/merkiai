/**
 * Lectura de planes desde la BD de PLATAFORMA (control plane, service-role).
 */
import { platformDb } from './platform-db'
import type { DataIsolation } from './plan-validation'

export interface PlanRow {
  key: string
  name: string
  price_cents: number
  currency: string
  features: Record<string, unknown>
  limits: Record<string, unknown>
  /** HU-281 · matriz rol→secciones del admin (solo roles de staff). */
  role_access?: Record<string, string[]>
  data_isolation: DataIsolation
  active: boolean
}

export async function getPlans(): Promise<PlanRow[]> {
  const { data } = await platformDb()
    .from('plans')
    .select('key, name, price_cents, currency, features, limits, role_access, data_isolation, active')
    .order('price_cents', { ascending: true })
  return (data ?? []) as PlanRow[]
}
