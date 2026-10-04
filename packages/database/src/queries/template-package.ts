/**
 * HU-129 · Paquete de Plantilla exportable/importable.
 *
 * Una "Plantilla" (HU-121) = tema con paleta + tipografía + layout del home +
 * modo claro/oscuro + color de producto. Este módulo serializa ese tema a un
 * paquete JSON **versionado y tolerante** (ignora claves desconocidas y rellena
 * las nuevas con defaults), para reutilizar diseños entre tiendas/instancias.
 *
 * Se compone con el export/import general (HU-123) cuando exista: el manifiesto
 * de aquél podrá incluir estos paquetes sin reescribir el importador.
 *
 * Lógica pura y testeable; los helpers de BD la envuelven.
 */
import type { Db } from '../client'
import type { Theme, ThemeInput } from './themes'
import { createTheme } from './themes'

/** Versión del esquema del paquete de plantilla. Subir al hacer cambios incompatibles. */
export const TEMPLATE_PACKAGE_VERSION = 1
export const TEMPLATE_PACKAGE_KIND = 'merkiai.template' as const

/** Campos del tema que viajan en el paquete (sin id/tenant/flags/timestamps). */
export const PACKAGE_THEME_FIELDS = [
  'name',
  'color_primary', 'color_dark', 'color_cream', 'color_cream_warm',
  'color_yellow', 'color_yellow_pale', 'color_text', 'color_price',
  'font_display', 'font_body',
  'color_scheme', 'dark_bg', 'dark_surface', 'dark_text',
  'template',
] as const

export interface TemplatePackage {
  kind: typeof TEMPLATE_PACKAGE_KIND
  schema_version: number
  /** Marca de generación (informativa). */
  exported_at?: string
  theme: Partial<Record<(typeof PACKAGE_THEME_FIELDS)[number], unknown>>
}

/** Defaults de los campos nuevos, para importar paquetes de versiones anteriores. */
const THEME_DEFAULTS: Record<string, unknown> = {
  color_primary: '#614A2A', color_dark: '#604B30', color_cream: '#FFF0D1',
  color_cream_warm: '#FFF1D3', color_yellow: '#FFF6B8', color_yellow_pale: '#FDF8B9',
  color_text: '#2D1A0A', color_price: null,
  font_display: 'cormorant', font_body: 'dm-sans',
  color_scheme: 'light', dark_bg: null, dark_surface: null, dark_text: null,
  template: null,
}

/** Construye el paquete a partir de un tema (pura). */
export function buildTemplatePackage(theme: Theme): TemplatePackage {
  const t: Record<string, unknown> = {}
  for (const k of PACKAGE_THEME_FIELDS) t[k] = (theme as unknown as Record<string, unknown>)[k]
  return {
    kind: TEMPLATE_PACKAGE_KIND,
    schema_version: TEMPLATE_PACKAGE_VERSION,
    exported_at: new Date().toISOString(),
    theme: t,
  }
}

export class TemplatePackageError extends Error {}

/**
 * Valida y normaliza un paquete a un `ThemeInput` listo para crear (pura).
 * Tolerante: ignora claves desconocidas, rellena las nuevas con defaults y
 * acepta versiones <= la actual. `nameOverride` permite renombrar al importar.
 */
export function parseTemplatePackage(raw: unknown, nameOverride?: string): ThemeInput {
  if (!raw || typeof raw !== 'object') throw new TemplatePackageError('Paquete inválido: no es un objeto.')
  const pkg = raw as Record<string, unknown>
  if (pkg.kind !== TEMPLATE_PACKAGE_KIND) throw new TemplatePackageError('Paquete inválido: no es una plantilla Merkiai.')
  const version = Number(pkg.schema_version)
  if (!Number.isFinite(version) || version < 1) throw new TemplatePackageError('Paquete inválido: versión de esquema ausente.')
  if (version > TEMPLATE_PACKAGE_VERSION) {
    throw new TemplatePackageError(`Paquete creado con una versión más nueva (v${version}); actualiza Merkiai para importarlo.`)
  }
  const theme = (pkg.theme && typeof pkg.theme === 'object') ? pkg.theme as Record<string, unknown> : {}

  const out: Record<string, unknown> = {}
  for (const k of PACKAGE_THEME_FIELDS) {
    // Campos conocidos: usa el del paquete; si falta, el default (migración tolerante).
    out[k] = k in theme ? theme[k] : (k in THEME_DEFAULTS ? THEME_DEFAULTS[k] : undefined)
  }
  const name = (nameOverride ?? (typeof out.name === 'string' ? out.name : '')).trim()
  if (!name) throw new TemplatePackageError('La plantilla necesita un nombre.')
  out.name = name
  const scheme = out.color_scheme
  if (scheme !== 'light' && scheme !== 'auto' && scheme !== 'dark') out.color_scheme = 'light'
  return out as unknown as ThemeInput
}

// ─── Helpers de BD ───────────────────────────────────────────────────────────

/** Importa un paquete creando un tema INACTIVO (no cambia el activo). */
export async function importTemplatePackage(raw: unknown, db: Db, nameOverride?: string): Promise<Theme> {
  const input = parseTemplatePackage(raw, nameOverride)
  // createTheme inserta is_active:false → la plantilla entra como borrador.
  return createTheme(input as Omit<ThemeInput, 'is_active'>, db)
}
