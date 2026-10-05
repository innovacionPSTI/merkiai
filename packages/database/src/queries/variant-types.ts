import type { Db } from '../client'
import type { Database, VariantType } from '../types'

function toVariantType(row: Record<string, unknown>): VariantType {
  return {
    ...(row as Omit<VariantType, 'values' | 'swatch_hex'>),
    values: Array.isArray(row.values) ? (row.values as string[]) : [],
    swatch_hex: row.swatch_hex && typeof row.swatch_hex === 'object' && !Array.isArray(row.swatch_hex)
      ? (row.swatch_hex as Record<string, string>)
      : {},
  }
}

/**
 * HU-264 · Fusiona los `swatch_hex` de los tipos de variante en un único mapa
 * valor(minúsculas)→hex para el storefront (pura, testeable). Es la fuente de
 * color de los swatches, reemplazando el diccionario fijo `COLOR_HEX`.
 */
export function buildSwatchColorMap(variantTypes: VariantType[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const vt of variantTypes) {
    for (const [value, hex] of Object.entries(vt.swatch_hex ?? {})) {
      if (typeof hex === 'string' && hex.trim()) map[value.toLowerCase()] = hex
    }
  }
  return map
}

/** Lista todos los tipos de variante, ordenados por order_index */
export async function getVariantTypes(activeOnly = false, db: Db): Promise<VariantType[]> {
  const supabase = db
  let query = supabase
    .from('variant_types')
    .select('*')
    .order('order_index', { ascending: true })
    .order('id', { ascending: true })

  if (activeOnly) query = query.eq('active', true)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []).map(toVariantType)
}

/** Obtiene un tipo de variante por ID */
export async function getVariantTypeById(id: number, db: Db): Promise<VariantType | null> {
  const supabase = db
  const { data, error } = await supabase
    .from('variant_types')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data ? toVariantType(data as Record<string, unknown>) : null
}

export interface CreateVariantTypeInput {
  name: string
  values: string[]
  display_type?: 'pill' | 'swatch'
  order_index?: number
  /** HU-264 · mapa valor→hex para swatches. */
  swatch_hex?: Record<string, string>
}

/** Crea un nuevo tipo de variante */
export async function createVariantType(
  input: CreateVariantTypeInput,
  db: Db,
  tenantId: string,
): Promise<VariantType> {
  const supabase = db
  const { data, error } = await supabase
    .from('variant_types')
    .insert({
      name: input.name.trim(),
      values: input.values,
      swatch_hex: (input.swatch_hex ?? {}) as unknown as Database['public']['Tables']['variant_types']['Insert']['swatch_hex'],
      display_type: input.display_type ?? 'pill',
      order_index: input.order_index ?? 0,
      tenant_id: tenantId,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return toVariantType(data as Record<string, unknown>)
}

export interface UpdateVariantTypeInput {
  name?: string
  values?: string[]
  display_type?: 'pill' | 'swatch'
  active?: boolean
  order_index?: number
  /** HU-264 · mapa valor→hex para swatches. */
  swatch_hex?: Record<string, string>
}

/** Actualiza un tipo de variante existente */
export async function updateVariantType(id: number, input: UpdateVariantTypeInput, db: Db): Promise<VariantType> {
  const supabase = db

  // Build a typed update object (only include defined fields)
  type VariantTypeUpdate = Database['public']['Tables']['variant_types']['Update']
  const patch: VariantTypeUpdate = {}
  if (input.name !== undefined) patch.name = input.name.trim()
  if (input.values !== undefined) patch.values = input.values
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (input.swatch_hex !== undefined) (patch as any).swatch_hex = input.swatch_hex
  if (input.display_type !== undefined) patch.display_type = input.display_type
  if (input.active !== undefined) patch.active = input.active
  if (input.order_index !== undefined) patch.order_index = input.order_index

  const { data, error } = await supabase
    .from('variant_types')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return toVariantType(data as Record<string, unknown>)
}

/** Elimina un tipo de variante */
export async function deleteVariantType(id: number, db: Db): Promise<void> {
  const supabase = db
  const { error } = await supabase.from('variant_types').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
