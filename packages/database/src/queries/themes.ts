import { createServerClient, type Db } from '../client'

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface Theme {
  id: number
  name: string
  is_active: boolean
  is_default: boolean
  color_primary: string
  color_dark: string
  color_cream: string
  color_cream_warm: string
  color_yellow: string
  color_yellow_pale: string
  color_text: string
  /** Identificador de fuente display: 'cormorant' | 'playfair' */
  font_display: string
  /** Identificador de fuente body: 'dm-sans' | 'inter' */
  font_body: string
  created_at: string
  updated_at: string
}

export type ThemeInput = Omit<Theme, 'id' | 'is_default' | 'created_at' | 'updated_at'>

// ── Queries ───────────────────────────────────────────────────────────────────

/** Lista todos los temas ordenados por fecha de creación */
export async function getThemes(db: Db = createServerClient()): Promise<Theme[]> {
  const supabase = db
  const { data, error } = await supabase
    .from('themes')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

/** Devuelve el tema activo, o null si ninguno está activo */
export async function getActiveTheme(db: Db = createServerClient()): Promise<Theme | null> {
  const supabase = db
  const { data } = await supabase
    .from('themes')
    .select('*')
    .eq('is_active', true)
    .maybeSingle()
  return data ?? null
}

/** Crea un nuevo tema (inactivo por defecto) */
export async function createTheme(input: Omit<ThemeInput, 'is_active'>, db: Db = createServerClient()): Promise<Theme> {
  const supabase = db
  const { data, error } = await supabase
    .from('themes')
    .insert({ ...input, is_active: false })
    .select()
    .single()
  if (error) throw error
  return data
}

/** Actualiza los campos de un tema existente */
export async function updateTheme(
  id: number,
  input: Partial<Omit<Theme, 'id' | 'is_default' | 'created_at' | 'updated_at'>>, db: Db = createServerClient()
): Promise<Theme> {
  const supabase = db
  const { data, error } = await supabase
    .from('themes')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

/**
 * Establece un tema como activo.
 * Desactiva todos los demás primero para respetar el unique index parcial.
 */
export async function setActiveTheme(id: number, db: Db = createServerClient()): Promise<void> {
  const supabase = db

  // 1. Desactivar cualquier tema activo actual
  await supabase
    .from('themes')
    .update({ is_active: false })
    .eq('is_active', true)

  // 2. Activar el tema elegido
  const { error } = await supabase
    .from('themes')
    .update({ is_active: true })
    .eq('id', id)

  if (error) throw error
}

/** Elimina un tema. No permite borrar el tema activo ni el por defecto. */
export async function deleteTheme(id: number, db: Db = createServerClient()): Promise<void> {
  const supabase = db

  const { data: theme } = await supabase
    .from('themes')
    .select('is_active, is_default')
    .eq('id', id)
    .maybeSingle()

  if (!theme) throw new Error('Tema no encontrado')
  if (theme.is_active) throw new Error('No se puede eliminar el tema activo')
  if (theme.is_default) throw new Error('No se puede eliminar el tema por defecto')

  const { error } = await supabase.from('themes').delete().eq('id', id)
  if (error) throw error
}
