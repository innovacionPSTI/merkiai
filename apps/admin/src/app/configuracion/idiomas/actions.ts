'use server'

/**
 * Acciones de "Idiomas y mercados" (E28 · HU-461). La validación vive en la capa
 * de datos (`validateMarkets`, reglas del plan incluidas); aquí solo se mapean
 * los errores a mensajes y se registra la auditoría.
 */
import { revalidatePath } from 'next/cache'
import { saveMarket, deleteMarket, logAudit, MarketValidationError, type MarketInput } from '@merkiai/database'
import { requireMarkets } from '@/lib/markets'

export type MarketActionResult = { ok: true; message: string } | { ok: false; error: string; errors?: string[] }

async function run(fn: (ctx: Awaited<ReturnType<typeof requireMarkets>>) => Promise<{ message: string; audit: { action: string; entityId?: string | number | null; metadata?: Record<string, unknown> } }>): Promise<MarketActionResult> {
  try {
    const ctx = await requireMarkets()
    const r = await fn(ctx)
    revalidatePath('/configuracion/idiomas')
    await logAudit(ctx.db, {
      tenantId: ctx.tenantId, actorEmail: ctx.adminUser.email, actorRole: ctx.adminUser.role,
      action: r.audit.action, entity: 'market', entityId: r.audit.entityId ?? null, summary: r.message, metadata: r.audit.metadata,
    })
    return { ok: true, message: r.message }
  } catch (e) {
    if (e && typeof e === 'object' && 'digest' in e) throw e
    if (e instanceof MarketValidationError) return { ok: false, error: e.errors[0] ?? e.message, errors: e.errors }
    return { ok: false, error: e instanceof Error ? e.message : 'No se pudo guardar.' }
  }
}

export async function saveMarketAction(input: MarketInput): Promise<MarketActionResult> {
  return run(async ({ db, tenantId, rules }) => {
    const m = await saveMarket(db, tenantId, input, rules)
    return {
      message: `Mercado "${m.name}" guardado.`,
      audit: { action: input.id ? 'market.update' : 'market.create', entityId: m.id, metadata: { locales: m.locales, default_locale: m.default_locale, is_default: m.is_default } },
    }
  })
}

export async function deleteMarketAction(id: number): Promise<MarketActionResult> {
  return run(async ({ db, tenantId }) => {
    await deleteMarket(db, tenantId, id)
    return { message: 'Mercado eliminado.', audit: { action: 'market.delete', entityId: id } }
  })
}
