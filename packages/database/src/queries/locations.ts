/**
 * queries/locations.ts — Ubicaciones (E18·HU-176).
 *
 * Bodegas, tiendas físicas y puntos de retiro; dimensión de ubicación del ledger.
 * `isLocationKind` y `pickDefaultLocationId` son **puros**. El resto es CRUD
 * tenant-scoped. Al marcar una como `is_default` se desmarca la anterior (una
 * sola por tenant, reforzado por índice único parcial).
 */
import type { Db } from '../client'

export const LOCATION_KINDS = ['warehouse', 'store', 'pickup'] as const
export type LocationKind = (typeof LOCATION_KINDS)[number]

export function isLocationKind(v: unknown): v is LocationKind {
  return typeof v === 'string' && (LOCATION_KINDS as readonly string[]).includes(v)
}

export interface Location {
  id: number
  tenant_id?: string
  code: string
  name: string
  kind: LocationKind
  address: string | null
  city: string | null
  department: string | null
  is_default: boolean
  active: boolean
}

/** Id de la ubicación por defecto (o la primera activa, o null). Puro. */
export function pickDefaultLocationId(locations: Location[]): number | null {
  const def = locations.find((l) => l.is_default && l.active)
  if (def) return def.id
  const firstActive = locations.find((l) => l.active)
  return firstActive?.id ?? null
}

export async function listLocations(db: Db, opts: { activeOnly?: boolean } = {}): Promise<Location[]> {
  let q = db.from('locations').select('*').order('is_default', { ascending: false }).order('name')
  if (opts.activeOnly) q = q.eq('active', true)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as unknown as Location[]
}

export async function createLocation(
  db: Db,
  input: { tenant_id?: string; code: string; name: string; kind?: LocationKind; address?: string | null; city?: string | null; department?: string | null; is_default?: boolean },
): Promise<Location> {
  const row = {
    tenant_id: input.tenant_id,
    code: input.code.trim(),
    name: input.name.trim(),
    kind: input.kind ?? 'warehouse',
    address: input.address?.trim() || null,
    city: input.city?.trim() || null,
    department: input.department?.trim() || null,
    is_default: input.is_default ?? false,
  }
  if (row.is_default) await clearDefault(db, input.tenant_id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await db.from('locations').insert(row as any).select().single()
  if (error) throw error
  return data as unknown as Location
}

export async function updateLocation(
  db: Db,
  id: number,
  patch: Partial<{ name: string; kind: LocationKind; address: string | null; city: string | null; department: string | null; active: boolean }>,
): Promise<Location> {
  const { data, error } = await db
    .from('locations')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ ...patch, updated_at: new Date().toISOString() } as any)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as unknown as Location
}

/** Marca una ubicación como predeterminada (desmarca la anterior del tenant). */
export async function setDefaultLocation(db: Db, id: number, tenantId?: string): Promise<void> {
  await clearDefault(db, tenantId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await db.from('locations').update({ is_default: true, updated_at: new Date().toISOString() } as any).eq('id', id)
  if (error) throw error
}

async function clearDefault(db: Db, tenantId?: string): Promise<void> {
  let q = db.from('locations')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ is_default: false, updated_at: new Date().toISOString() } as any)
    .eq('is_default', true)
  if (tenantId) q = q.eq('tenant_id', tenantId)
  await q
}
