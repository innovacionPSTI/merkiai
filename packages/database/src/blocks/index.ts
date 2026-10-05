/**
 * Entrada PURA del contrato de bloques (sin crypto ni Supabase), apta para
 * componentes cliente. Importar desde `@merkiai/database/blocks` evita arrastrar
 * el barrel completo (que incluye utilidades server-only como preview.ts/node:crypto).
 */
export * from './schema'
export * from './section-style'
