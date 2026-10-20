/**
 * Utilidades de email transaccional compartidas entre apps/web y apps/admin.
 * Usa la abstracción EmailProvider — por defecto ResendProvider.
 *
 * Las funciones específicas de cada app (sendOrderConfirmation, sendWelcomeEmail,
 * sendNewsletterConfirmation, buildEmailConfig) permanecen en cada app.
 */

import { getEmailProvider } from '../providers/email'
import type { Db } from '../client'
import { resolveTemplate, getEmailTemplateOverride } from '../queries/email-templates'

export interface EmailConfig {
  apiKey: string
  fromEmail: string
  /** Nombre de la tienda — desde store_config.store_name */
  storeName?: string
  /** URL base del sitio */
  siteUrl?: string
  /** Proveedor activo — desde store_config.email_provider. Default: 'resend'. */
  emailProvider?: string | null
}

interface EmailPayload {
  from: string
  to: string[]
  subject: string
  html: string
}

async function sendEmail(config: EmailConfig, payload: EmailPayload): Promise<void> {
  const provider = getEmailProvider({ provider: config.emailProvider, apiKey: config.apiKey })
  await provider.send(payload)
}

/** Escapa HTML y convierte el texto de la plantilla (con saltos de línea y URLs)
 *  en párrafos seguros. HU-160. Pura. */
function templateBodyToHtml(body: string): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const linkify = (s: string) => s.replace(/(https?:\/\/[^\s<]+)/g, (u) => `<a href="${u}" style="color:#614a2a;">${u}</a>`)
  return (body ?? '')
    .split(/\n{2,}/)
    .map((para) => `<p style="margin: 0 0 16px; color: #8a6a4a; font-size: 14px; font-family: sans-serif; line-height: 1.5;">${linkify(esc(para)).replace(/\n/g, '<br>')}</p>`)
    .join('')
}

export interface TemplatedEmailResult { status: 'sent' | 'suppressed' | 'skipped'; subject?: string }

/**
 * HU-160 · envía un correo usando la **plantilla editable** del tenant (override
 * o default de sistema), interpolando variables y respetando el toggle de
 * activación. Si el tipo está silenciado → 'suppressed' (no envía). Si no hay
 * plantilla → 'skipped'. El layout/tema lo pone la app (`baseTemplate`).
 */
export async function sendTemplatedEmail(
  db: Db,
  params: { tenantId: string; type: string; to: string; vars: Record<string, string | number | null | undefined>; locale?: string },
  config: EmailConfig,
): Promise<TemplatedEmailResult> {
  const override = await getEmailTemplateOverride(db, params.type, params.locale ?? 'es').catch(() => null)
  const resolved = resolveTemplate(params.type, params.vars, override)
  if (!resolved) return { status: 'skipped' }
  if (!resolved.enabled) return { status: 'suppressed' }
  const name = config.storeName ?? 'Mi Tienda'
  await sendEmail(config, {
    from: `${name} <${config.fromEmail}>`,
    to: [params.to],
    subject: resolved.subject,
    html: baseTemplate(templateBodyToHtml(resolved.body), config),
  })
  return { status: 'sent', subject: resolved.subject }
}

/** Envío directo (asunto+HTML ya renderizados). Para correos de prueba (HU-160). */
export async function sendRawEmail(config: EmailConfig, data: { to: string; subject: string; html: string }): Promise<void> {
  const name = config.storeName ?? 'Mi Tienda'
  await sendEmail(config, { from: `${name} <${config.fromEmail}>`, to: [data.to], subject: data.subject, html: data.html })
}

/** HU-160 · render de previsualización (no envía): asunto + HTML final. */
export function renderTemplatedPreview(
  type: string,
  vars: Record<string, string | number | null | undefined>,
  override: { subject?: string; body?: string; enabled?: boolean } | null,
  config: EmailConfig,
): { subject: string; html: string; enabled: boolean } | null {
  const resolved = resolveTemplate(type, vars, override)
  if (!resolved) return null
  return { subject: resolved.subject, html: baseTemplate(templateBodyToHtml(resolved.body), config), enabled: resolved.enabled }
}

function baseTemplate(content: string, config: EmailConfig): string {
  const name = config.storeName ?? 'Mi Tienda'
  const url  = (config.siteUrl ?? '').replace(/\/$/, '')

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #fff8ec;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; overflow: hidden; max-width: 600px;">
          <tr>
            <td style="background: #614a2a; padding: 24px 32px; text-align: center;">
              <h1 style="margin: 0; color: #fff8ec; font-size: 24px; letter-spacing: 0.1em;">${name}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">${content}</td>
          </tr>
          <tr>
            <td style="background: #fff0d1; padding: 16px 32px; text-align: center; border-top: 1px solid #f0e8d0;">
              <p style="margin: 0; font-size: 12px; color: #8a6a4a; font-family: sans-serif;">
                ${name}${url ? ` · <a href="${url}" style="color: #614a2a;">${url.replace(/^https?:\/\//, '')}</a>` : ''}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/** Notificación al cliente cuando el pedido cambia a "shipped" */
export async function sendShippingNotification(
  order: {
    order_number: string
    customer_email: string
    customer_name: string
    tracking_number?: string | null
    carrier_name?: string | null
    label_url?: string | null
  },
  config: EmailConfig,
): Promise<void> {
  const name = config.storeName ?? 'Mi Tienda'

  const content = `
    <h2 style="margin: 0 0 8px; color: #614a2a; font-size: 20px; font-family: sans-serif;">¡Tu pedido está en camino!</h2>
    <p style="margin: 0 0 24px; color: #8a6a4a; font-size: 14px; font-family: sans-serif;">
      Tu pedido <strong>${order.order_number}</strong> ha sido despachado.
    </p>
    ${order.tracking_number ? `
    <div style="background: #fff8ec; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
      <p style="margin: 0 0 4px; font-size: 13px; color: #8a6a4a; font-family: sans-serif;">Número de tracking</p>
      <p style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: #614a2a; letter-spacing: 0.05em; font-family: monospace;">${order.tracking_number}</p>
      ${order.carrier_name ? `<p style="margin: 0; font-size: 13px; color: #8a6a4a; font-family: sans-serif;">Transportadora: <strong>${order.carrier_name}</strong></p>` : ''}
    </div>
    ${order.label_url ? `
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${order.label_url}" style="display: inline-block; background: #614a2a; color: #fff8ec; text-decoration: none; padding: 12px 28px; border-radius: 50px; font-size: 14px; font-weight: 600; font-family: sans-serif;">
        Descargar guía de envío
      </a>
    </div>` : ''}` : ''}
    <p style="margin: 0; font-size: 13px; color: #8a6a4a; text-align: center; font-family: sans-serif;">
      Pedido: <strong>${order.order_number}</strong> · ${order.customer_name}
    </p>`

  await sendEmail(config, {
    from: `${name} <${config.fromEmail}>`,
    to: [order.customer_email],
    subject: `Tu pedido ${order.order_number} ha sido despachado — ${name}`,
    html: baseTemplate(content, config),
  })
}

/** Notificación al cliente cuando el administrador confirma manualmente el pago */
export async function sendPaymentConfirmed(
  order: {
    order_number: string
    customer_email: string
    customer_name: string
  },
  config: EmailConfig,
): Promise<void> {
  const name = config.storeName ?? 'Mi Tienda'

  const content = `
    <h2 style="margin: 0 0 8px; color: #614a2a; font-size: 20px; font-family: sans-serif;">¡Confirmamos tu pago!</h2>
    <p style="margin: 0 0 24px; color: #8a6a4a; font-size: 14px; font-family: sans-serif;">
      Verificamos el pago de tu pedido <strong>${order.order_number}</strong> y ya está en preparación.
      Te avisaremos cuando sea despachado.
    </p>
    <p style="margin: 0; font-size: 13px; color: #8a6a4a; text-align: center; font-family: sans-serif;">
      Pedido: <strong>${order.order_number}</strong> · ${order.customer_name}
    </p>`

  await sendEmail(config, {
    from: `${name} <${config.fromEmail}>`,
    to: [order.customer_email],
    subject: `Pago confirmado — Pedido ${order.order_number} · ${name}`,
    html: baseTemplate(content, config),
  })
}

/** Notificación genérica de cambio de estado — para "delivered" y "cancelled" */
export async function sendStatusNotification(
  order: {
    order_number: string
    customer_email: string
    customer_name: string
  },
  status: 'delivered' | 'cancelled',
  config: EmailConfig,
): Promise<void> {
  const name = config.storeName ?? 'Mi Tienda'

  const isDelivered = status === 'delivered'
  const heading = isDelivered ? '¡Tu pedido fue entregado!' : 'Tu pedido ha sido cancelado'
  const body = isDelivered
    ? `Tu pedido <strong>${order.order_number}</strong> fue marcado como entregado. Esperamos que disfrutes tu compra.`
    : `Tu pedido <strong>${order.order_number}</strong> ha sido cancelado. Si tienes dudas, contáctanos.`

  const content = `
    <h2 style="margin: 0 0 8px; color: #614a2a; font-size: 20px; font-family: sans-serif;">${heading}</h2>
    <p style="margin: 0 0 24px; color: #8a6a4a; font-size: 14px; font-family: sans-serif;">${body}</p>
    <p style="margin: 0; font-size: 13px; color: #8a6a4a; text-align: center; font-family: sans-serif;">
      Pedido: <strong>${order.order_number}</strong> · ${order.customer_name}
    </p>`

  const subjects: Record<typeof status, string> = {
    delivered: `Pedido ${order.order_number} entregado — ${name}`,
    cancelled:  `Pedido ${order.order_number} cancelado — ${name}`,
  }

  await sendEmail(config, {
    from: `${name} <${config.fromEmail}>`,
    to: [order.customer_email],
    subject: subjects[status],
    html: baseTemplate(content, config),
  })
}

/** HU-105 · aviso de reposición de stock ("avísame cuando vuelva"). */
export async function sendBackInStock(
  data: {
    to: string
    productName: string
    productUrl?: string | null
    variantLabel?: string | null
  },
  config: EmailConfig,
): Promise<void> {
  const name = config.storeName ?? 'Mi Tienda'
  const label = data.variantLabel ? ` (${data.variantLabel})` : ''

  const content = `
    <h2 style="margin: 0 0 8px; color: #614a2a; font-size: 20px; font-family: sans-serif;">¡Volvió a estar disponible!</h2>
    <p style="margin: 0 0 24px; color: #8a6a4a; font-size: 14px; font-family: sans-serif;">
      <strong>${data.productName}</strong>${label} ya tiene stock. Si todavía lo quieres, consíguelo antes de que se agote de nuevo.
    </p>
    ${data.productUrl ? `
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${data.productUrl}" style="display: inline-block; background: #614a2a; color: #fff8ec; text-decoration: none; padding: 12px 28px; border-radius: 50px; font-size: 14px; font-weight: 600; font-family: sans-serif;">
        Ver producto
      </a>
    </div>` : ''}`

  await sendEmail(config, {
    from: `${name} <${config.fromEmail}>`,
    to: [data.to],
    subject: `Ya disponible: ${data.productName} — ${name}`,
    html: baseTemplate(content, config),
  })
}

/** HU-292 · invitación a una venta VIP / acceso anticipado. */
export async function sendVipCampaignInvite(
  data: {
    to: string
    campaignName: string
    accessUrl?: string | null
    endsAt?: string | null
  },
  config: EmailConfig,
): Promise<void> {
  const name = config.storeName ?? 'Mi Tienda'
  const when = data.endsAt ? new Date(data.endsAt).toLocaleString('es-CO') : null

  const content = `
    <p style="margin: 0 0 4px; color: #8a6a4a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-family: sans-serif;">Acceso anticipado VIP</p>
    <h2 style="margin: 0 0 8px; color: #614a2a; font-size: 20px; font-family: sans-serif;">${data.campaignName}</h2>
    <p style="margin: 0 0 24px; color: #8a6a4a; font-size: 14px; font-family: sans-serif;">
      Como miembro de nuestro Club VIP, tienes acceso anticipado a esta venta exclusiva${when ? ` hasta el <strong>${when}</strong>` : ''}. Aprovéchala antes que el público general.
    </p>
    ${data.accessUrl ? `
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${data.accessUrl}" style="display: inline-block; background: #614a2a; color: #fff8ec; text-decoration: none; padding: 12px 28px; border-radius: 50px; font-size: 14px; font-weight: 600; font-family: sans-serif;">
        Comprar ahora
      </a>
    </div>` : ''}`

  await sendEmail(config, {
    from: `${name} <${config.fromEmail}>`,
    to: [data.to],
    subject: `Acceso VIP: ${data.campaignName} — ${name}`,
    html: baseTemplate(content, config),
  })
}
