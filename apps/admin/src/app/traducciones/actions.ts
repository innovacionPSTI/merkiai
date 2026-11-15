'use server'

/**
 * Acciones del editor de traducciones (E28 · HU-464). Guardan con el cliente RLS
 * del tenant y dejan rastro en la auditoría (AC-5).
 */
import { revalidatePath } from 'next/cache'
import {
  saveWorkspaceTranslation, csvToTranslationRows, groupCsvRows, logAudit, type WorkspaceType,
} from '@merkiai/database'
import { requireTranslations } from '@/lib/translations'

export type TrResult = { ok: true; message: string } | { ok: false; error: string }

const TYPES = new Set<WorkspaceType>(['product', 'category', 'blog_post', 'page', 'section', 'item'])

export async function saveTranslationAction(type: WorkspaceType, id: string, locale: string, values: Record<string, string>): Promise<TrResult> {
  try {
    const ctx = await requireTranslations()
    if (!TYPES.has(type)) return { ok: false, error: 'Tipo de contenido inválido.' }
    if (!ctx.locales.includes(locale)) return { ok: false, error: 'Ese idioma no está publicado en tu tienda.' }
    await saveWorkspaceTranslation(ctx.db, ctx.tenantId, type, id, locale, values)
    await logAudit(ctx.db, {
      tenantId: ctx.tenantId, actorEmail: ctx.adminUser.email, actorRole: ctx.adminUser.role,
      action: 'translation.save', entity: type, entityId: id, summary: `Traducción ${locale}`, metadata: { locale, fields: Object.keys(values) },
    })
    revalidatePath('/traducciones')
    return { ok: true, message: 'Traducción guardada.' }
  } catch (e) {
    if (e && typeof e === 'object' && 'digest' in e) throw e
    return { ok: false, error: e instanceof Error ? e.message : 'No se pudo guardar.' }
  }
}

/** AC-3 · importa un CSV exportado (y traducido fuera) para un idioma. */
export async function importTranslationsAction(locale: string, csvText: string): Promise<TrResult> {
  try {
    const ctx = await requireTranslations()
    if (!ctx.locales.includes(locale)) return { ok: false, error: 'Ese idioma no está publicado en tu tienda.' }
    if (csvText.length > 5_000_000) return { ok: false, error: 'El archivo es demasiado grande (máx. 5 MB).' }
    const { rows, skipped } = csvToTranslationRows(csvText)
    const groups = groupCsvRows(rows)
    let saved = 0
    const failed: string[] = []
    for (const g of groups) {
      try { await saveWorkspaceTranslation(ctx.db, ctx.tenantId, g.type, g.id, locale, g.values); saved++ }
      catch (e) { failed.push(`${g.type} ${g.id}: ${e instanceof Error ? e.message : 'error'}`) }
    }
    await logAudit(ctx.db, {
      tenantId: ctx.tenantId, actorEmail: ctx.adminUser.email, actorRole: ctx.adminUser.role,
      action: 'translation.import', entity: 'translations', summary: `Importación ${locale}: ${saved} elementos`, metadata: { locale, saved, failed: failed.length, skipped },
    })
    revalidatePath('/traducciones')
    const extra = [skipped ? `${skipped} fila(s) ignorada(s)` : '', failed.length ? `${failed.length} con error (${failed.slice(0, 3).join('; ')})` : ''].filter(Boolean).join(' · ')
    return { ok: true, message: `Se actualizaron ${saved} elemento(s).${extra ? ` ${extra}.` : ''}` }
  } catch (e) {
    if (e && typeof e === 'object' && 'digest' in e) throw e
    return { ok: false, error: e instanceof Error ? e.message : 'No se pudo importar.' }
  }
}
