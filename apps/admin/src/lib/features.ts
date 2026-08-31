/**
 * Feature flags del panel admin.
 *
 * Se leen de variables `NEXT_PUBLIC_*` (inlined en build) para que sirvan tanto
 * en server components como en cliente. Convivencia: una feature en `false`
 * deja el flujo actual intacto; en `true` expone el nuevo sin quitar el viejo.
 */
export const FEATURES = {
  /** HU-218.3 · Constructor de páginas schema-driven (beta, convive con /contenido). */
  pageBuilder: process.env.NEXT_PUBLIC_FEATURE_PAGE_BUILDER === 'true',
} as const

export type FeatureName = keyof typeof FEATURES
