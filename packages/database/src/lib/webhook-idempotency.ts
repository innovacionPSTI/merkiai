/**
 * Idempotencia de webhooks de pago.
 *
 * Registra cada evento procesado en `processed_webhook_events`. Si el mismo
 * (provider, event_id) llega de nuevo (reintento del proveedor), el INSERT choca
 * con la PK (código 23505) y se reporta como duplicado para NO reprocesar (evita
 * doble descuento de stock / doble email). Es complementario a la idempotencia por
 * estado del pedido; añade una barrera fuerte y una traza auditable.
 */

import { createServerClient } from '../client'

export async function markWebhookEventProcessed(
  provider: string,
  eventId: string,
): Promise<{ duplicate: boolean }> {
  // Sin id estable no se puede deduplicar: se deja pasar (se apoya en la
  // idempotencia por estado del pedido).
  if (!eventId) return { duplicate: false }

  const supabase = createServerClient()
  const { error } = await supabase
    .from('processed_webhook_events')
    .insert({ provider, event_id: eventId })

  if (error) {
    // 23505 = unique_violation → ya se procesó este evento.
    if ((error as { code?: string }).code === '23505') return { duplicate: true }
    // Otros errores de BD no deben bloquear el webhook (fail-open a nivel de
    // idempotencia; el pago sí se sigue verificando por firma/re-consulta).
    console.error('[webhook-idempotency] error registrando evento:', error)
    return { duplicate: false }
  }
  return { duplicate: false }
}
