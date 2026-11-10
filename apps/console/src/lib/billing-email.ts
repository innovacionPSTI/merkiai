/**
 * Correos de billing (HU-440). Plantillas PURAS + envío por Resend (fetch).
 * Sin `RESEND_API_KEY` el mailer es no-op con log (dev / entornos sin correo).
 */
import type { BillingEmailTemplate, BillingMailer } from './billing'

type Ctx = { tenantName: string; amountCents: number; currency: string; periodEnd: string | null }

export function formatMoney(amountCents: number, currency: string): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amountCents / 100)
}
function formatDate(iso: string | null): string {
  return iso ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeZone: 'America/Bogota' }).format(new Date(iso)) : '—'
}
const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ESC[c])

/** Asunto + cuerpo por plantilla. PURO. */
export function renderBillingEmail(template: BillingEmailTemplate, ctx: Ctx): { subject: string; html: string } {
  const money = formatMoney(ctx.amountCents, ctx.currency)
  const until = formatDate(ctx.periodEnd)
  const copy: Record<BillingEmailTemplate, { subject: string; body: string }> = {
    activated: { subject: 'Tu tienda Merkiai está activa', body: `Recibimos tu pago de ${money}. Tu plan queda activo hasta el ${until}; se renovará automáticamente.` },
    receipt: { subject: 'Recibo de tu plan Merkiai', body: `Cobramos ${money} por la renovación de tu plan. Próxima renovación: ${until}.` },
    payment_failed: { subject: 'No pudimos cobrar tu plan Merkiai', body: `El cobro de ${money} fue rechazado. Reintentaremos en los próximos días; actualiza tu medio de pago desde el panel para evitar la suspensión de la tienda.` },
    suspended: { subject: 'Tu tienda Merkiai fue suspendida', body: `No logramos cobrar ${money} tras varios intentos y la tienda quedó suspendida. Tus datos están a salvo: al registrar el pago se reactiva de inmediato.` },
    reactivated: { subject: 'Tu tienda Merkiai fue reactivada', body: `Recibimos tu pago de ${money}. La tienda vuelve a estar activa hasta el ${until}.` },
    canceled: { subject: 'Tu suscripción a Merkiai fue cancelada', body: 'Cancelamos tu suscripción. Si fue un error, escríbenos y la restablecemos.' },
  }
  const { subject, body } = copy[template]
  const html = `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto;color:#1f2937"><h2 style="margin:0 0 12px">${esc(subject)}</h2><p>Hola, <strong>${esc(ctx.tenantName)}</strong>.</p><p>${esc(body)}</p><p style="color:#6b7280;font-size:13px">Equipo Merkiai</p></div>`
  return { subject, html }
}

export function createBillingMailer(cfg: { apiKey?: string; from?: string; fetchImpl?: typeof fetch } = {}): BillingMailer {
  const apiKey = cfg.apiKey ?? process.env.RESEND_API_KEY
  const from = cfg.from ?? process.env.BILLING_EMAIL_FROM ?? 'Merkiai <facturacion@merkiai.com>'
  const doFetch = cfg.fetchImpl ?? fetch
  return {
    async send(to, template, ctx) {
      const { subject, html } = renderBillingEmail(template, ctx)
      if (!apiKey) { console.warn(`[billing] correo "${template}" omitido: falta RESEND_API_KEY`); return }
      const res = await doFetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
        body: JSON.stringify({ from, to, subject, html }),
      })
      if (!res.ok) throw new Error(`Resend ${res.status}`)
    },
  }
}
