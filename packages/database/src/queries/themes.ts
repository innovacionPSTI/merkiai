import type { Db } from '../client'

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
  /** HU-247 · modo de color: 'light' (default) | 'auto' (sigue el SO) | 'dark'. */
  color_scheme: string
  /** HU-247 · paleta oscura (override). NULL = defaults cálidos. */
  dark_bg: string | null
  dark_surface: string | null
  dark_text: string | null
  /** HU-247 · color del precio en vistas de producto. NULL = usa el primario. */
  color_price: string | null
  /** HU-121 · layout del home de esta plantilla. NULL = hereda de store_config. */
  template: string | null
  created_at: string
  updated_at: string
}

// Los campos de HU-247 (modo oscuro + color de precio) son opcionales al crear:
// la BD aplica defaults ('light' / NULL), así los callers existentes no cambian.
export type ThemeInput = Omit<
  Theme,
  'id' | 'is_default' | 'created_at' | 'updated_at' | 'color_scheme' | 'dark_bg' | 'dark_surface' | 'dark_text' | 'color_price' | 'template'
> & Partial<Pick<Theme, 'color_scheme' | 'dark_bg' | 'dark_surface' | 'dark_text' | 'color_price' | 'template'>>

// ── Queries ───────────────────────────────────────────────────────────────────

/** Lista todos los temas ordenados por fecha de creación */
export async function getThemes(db: Db): Promise<Theme[]> {
  const supabase = db
  const { data, error } = await supabase
    .from('themes')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

/** Devuelve el tema activo, o null si ninguno está activo */
export async function getActiveTheme(db: Db): Promise<Theme | null> {
  const supabase = db
  const { data } = await supabase
    .from('themes')
    .select('*')
    .eq('is_active', true)
    .maybeSingle()
  return data ?? null
}

/** Crea un nuevo tema (inactivo por defecto) */
export async function createTheme(input: Omit<ThemeInput, 'is_active'>, db: Db): Promise<Theme> {
  const supabase = db
  const { data, error } = await supabase
    .from('themes')
    .insert({ ...input, is_active: false })
    .select()
    .single()
  if (error) throw error
  return data
}

/**
 * HU-121 · Fija el layout del tema ACTIVO (la "plantilla" activa). Lo usa el
 * Constructor para mantener en sync el layout cuando se cambia desde ahí, de
 * modo que el tema (fuente de verdad del layout) y store_config.template no
 * diverjan. No falla si no hay tema activo.
 */
export async function setActiveThemeTemplate(template: string, db: Db): Promise<void> {
  await db.from('themes').update({ template }).eq('is_active', true)
}

/** Actualiza los campos de un tema existente */
export async function updateTheme(
  id: number,
  input: Partial<Omit<Theme, 'id' | 'is_default' | 'created_at' | 'updated_at'>>, db: Db
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
export async function setActiveTheme(id: number, db: Db): Promise<void> {
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
export async function deleteTheme(id: number, db: Db): Promise<void> {
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
