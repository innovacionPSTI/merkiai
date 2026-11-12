/**
 * Plan y facturación del tenant (HU-440) — puente admin → console (server-to-server).
 * La suscripción vive en la BD de plataforma; el admin solo consulta el resumen
 * (sin secretos) y pide el `formToken` para pagar. El estado lo actualiza la IPN.
 */
import { consoleUrl } from './console-url'

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'suspended' | 'canceled'

export interface BillingSummary {
  billingEnabled: boolean
  plan: { key: string; name: string; priceCents: number; currency: string } | null
  subscription: {
    status: SubscriptionStatus
    interval: 'monthly' | 'yearly'
    amountCents: number
    currency: string
    currentPeriodEnd: string | null
    pastDueSince: string | null
    failedAttempts: number
    hasPaymentMethod: boolean
    autoRenew: boolean
  } | null
  events: { label: string; amountCents: number | null; currency: string | null; at: string }[]
  /** HU-441 · comisiones mensuales de Merkiai Pagos (vacío si no aplica). */
  feeInvoices?: { period: string; amountCents: number; currency: string; status: 'pending' | 'processing' | 'paid' | 'failed' | 'waived' }[]
}

export const FEE_STATUS_LABEL: Record<string, string> = {
  pending: 'Por cobrar', processing: 'En proceso', paid: 'Cobrada', failed: 'Cobro rechazado', waived: 'Sin valor',
}

export interface CheckoutSession { formToken: string; publicKey: string | null; amountCents: number; currency: string }

/** Solo dueños/administradores gestionan el pago del plan. */
export function canManageBilling(role: string | undefined | null): boolean {
  return role === 'super_admin' || role === 'admin'
}

function endpoint(path: string): { url: string; headers: Record<string, string> } | null {
  const base = consoleUrl()
  const secret = process.env.INTERNAL_API_SECRET
  if (!base || !secret) return null
  return { url: `${base.replace(/\/$/, '')}${path}`, headers: { 'Content-Type': 'application/json', 'x-internal-secret': secret } }
}

export async function getBillingSummary(tenantId: string): Promise<BillingSummary | null> {
  const ep = endpoint(`/api/internal/tenants/${tenantId}/billing`)
  if (!ep) return null
  try {
    const res = await fetch(ep.url, { headers: ep.headers, cache: 'no-store' })
    return res.ok ? ((await res.json()) as BillingSummary) : null
  } catch {
    return null
  }
}

const CHECKOUT_ERRORS: Record<string, string> = {
  owner_email_missing: 'La tienda no tiene correo del dueño registrado. Escríbenos para completarlo.',
  plan_is_free: 'Tu plan actual es gratuito: no requiere pago.',
  plan_not_found: 'No encontramos tu plan. Escríbenos para revisarlo.',
  tenant_not_found: 'No encontramos tu tienda.',
}

export async function startBillingCheckout(
  tenantId: string,
  interval: 'monthly' | 'yearly',
): Promise<{ ok: true; session: CheckoutSession } | { ok: false; error: string }> {
  const ep = endpoint(`/api/internal/tenants/${tenantId}/billing/checkout`)
  if (!ep) return { ok: false, error: 'El cobro no está configurado en este entorno.' }
  try {
    const res = await fetch(ep.url, { method: 'POST', headers: ep.headers, body: JSON.stringify({ interval }), cache: 'no-store' })
    const body = await res.json().catch(() => null)
    if (!res.ok || !body?.formToken) {
      return { ok: false, error: CHECKOUT_ERRORS[body?.error] ?? 'No pudimos iniciar el pago. Intenta de nuevo en unos minutos.' }
    }
    return { ok: true, session: { formToken: body.formToken, publicKey: body.publicKey ?? null, amountCents: body.amountCents, currency: body.currency } }
  } catch {
    return { ok: false, error: 'No pudimos conectar con el servicio de cobro.' }
  }
}

// ─── Presentación (pura) ──────────────────────────────────────────────────────

export type BillingTone = 'success' | 'warn' | 'danger' | 'neutral'

export interface BillingView {
  tone: BillingTone
  title: string
  message: string
  /** Texto del botón principal; null = no hace falta pagar ahora. */
  cta: string | null
}

const fmtDate = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeZone: 'America/Bogota' }).format(new Date(iso)) : ''

/** Qué decirle al dueño según el estado de su suscripción. PURO. */
export function billingView(summary: Pick<BillingSummary, 'plan' | 'subscription'>): BillingView {
  const sub = summary.subscription
  if (summary.plan && summary.plan.priceCents <= 0) {
    return { tone: 'neutral', title: 'Plan gratuito', message: 'Tu plan actual no tiene costo.', cta: null }
  }
  if (!sub || sub.status === 'trialing') {
    return { tone: 'neutral', title: 'Activa tu plan', message: 'Registra tu tarjeta para activar el plan. El cobro se renovará automáticamente.', cta: 'Pagar y activar' }
  }
  switch (sub.status) {
    case 'active':
      return {
        tone: 'success',
        title: 'Al día',
        message: sub.autoRenew
          ? `Tu plan está activo hasta el ${fmtDate(sub.currentPeriodEnd)} y se renovará automáticamente.`
          : `Tu plan está activo hasta el ${fmtDate(sub.currentPeriodEnd)}.`,
        cta: 'Cambiar tarjeta',
      }
    case 'past_due':
      return {
        tone: 'warn',
        title: 'Pago pendiente',
        message: `No pudimos cobrar tu plan (${sub.failedAttempts} ${sub.failedAttempts === 1 ? 'intento' : 'intentos'}). Paga ahora o cambia la tarjeta para evitar la suspensión de la tienda.`,
        cta: 'Pagar ahora',
      }
    case 'suspended':
      return { tone: 'danger', title: 'Tienda suspendida', message: 'Tu tienda está pausada por falta de pago. Tus datos están a salvo: al pagar se reactiva de inmediato.', cta: 'Pagar y reactivar' }
    case 'canceled':
      return { tone: 'neutral', title: 'Suscripción cancelada', message: 'Escríbenos si quieres reactivar tu tienda.', cta: null }
  }
}
