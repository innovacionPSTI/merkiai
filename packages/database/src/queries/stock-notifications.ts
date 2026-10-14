import type { Db } from '../client'
import { sendBackInStock, type EmailConfig } from '../lib/email'

/**
 * "Avísame cuando vuelva" (HU-105). El storefront crea la suscripción (RLS anon,
 * siempre sin notificar y en su tenant); al reponer stock, el admin dispara el
 * aviso (is_admin) que envía el correo una sola vez y marca `notified_at`.
 * `db` se pasa por parámetro (RLS por tenant); nunca service-role en tienda.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Valida un correo de suscripción (puro). */
export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim())
}

/**
 * Suscribe un correo a la reposición de una variante. Idempotente: si ya existe
 * una suscripción pendiente (índice único parcial), se considera OK sin duplicar.
 */
export async function subscribeStockNotification(
  db: Db,
  variantId: number,
  email: string,
  tenantId: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!Number.isInteger(variantId)) return { ok: false, error: 'Variante inválida.' }
  if (!isValidEmail(email)) return { ok: false, error: 'Correo inválido.' }

  const { error } = await db.from('stock_notifications').insert({
    tenant_id: tenantId,
    variant_id: variantId,
    email: email.trim().toLowerCase(),
    notified_at: null,
  })

  // 23505 = unique_violation → ya estaba suscrito y pendiente; es OK (idempotente).
  if (error && (error as { code?: string }).code !== '23505') {
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

/** Suscriptores pendientes (sin notificar) de una variante. Admin (is_admin). */
export async function getPendingStockSubscribers(
  db: Db,
  variantId: number,
): Promise<{ id: number; email: string }[]> {
  const { data } = await db
    .from('stock_notifications')
    .select('id, email')
    .eq('variant_id', variantId)
    .is('notified_at', null)
  return (data ?? []) as { id: number; email: string }[]
}

/** Marca como notificadas las suscripciones indicadas. */
export async function markStockNotified(db: Db, ids: number[]): Promise<void> {
  if (ids.length === 0) return
  await db.from('stock_notifications').update({ notified_at: new Date().toISOString() }).in('id', ids)
}

/**
 * Notifica a los suscriptores pendientes de una variante que volvió a tener
 * stock, enviando un correo por suscriptor y marcándolos como notificados
 * (idempotente: no reenvía). Nunca lanza; devuelve cuántos avisos se enviaron.
 */
export async function notifyBackInStock(
  db: Db,
  variantId: number,
  info: { productName: string; productUrl?: string | null; variantLabel?: string | null },
  config: EmailConfig,
): Promise<number> {
  try {
    const subs = await getPendingStockSubscribers(db, variantId)
    if (subs.length === 0) return 0

    const sent: number[] = []
    for (const s of subs) {
      try {
        await sendBackInStock(
          { to: s.email, productName: info.productName, productUrl: info.productUrl, variantLabel: info.variantLabel },
          config,
        )
        sent.push(s.id)
      } catch (e) {
        console.error('[stock-notifications] fallo enviando aviso a', s.email, e instanceof Error ? e.message : e)
      }
    }
    await markStockNotified(db, sent)
    return sent.length
  } catch (e) {
    console.error('[stock-notifications] notifyBackInStock error:', e instanceof Error ? e.message : e)
    return 0
  }
}
