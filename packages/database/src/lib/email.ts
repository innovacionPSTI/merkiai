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
import { formatDateTime, createTranslator, normalizeLocale, DEFAULT_LOCALE } from '@merkiai/i18n'

/** Locale de un correo (E28 · HU-465): el del pedido/destinatario o el por defecto. */
function mailLocale(locale?: string | null): string {
  return normalizeLocale(locale ?? null) ?? DEFAULT_LOCALE
}

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

/** Hardening (XSS en correos): escapa datos de cliente/comerciante antes de insertarlos en HTML. */
function esc(s: unknown): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}
/** Nombre de remitente sin caracteres que rompan la cabecera From. */
function fromName(name: string | null | undefined): string {
  return String(name ?? '').replace(/[<>"\\\r\n]/g, '').trim().slice(0, 80) || 'Mi Tienda'
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
  const locale = mailLocale(params.locale)
  const override = await getEmailTemplateOverride(db, params.type, locale).catch(() => null)
  const resolved = resolveTemplate(params.type, params.vars, override, locale)
  if (!resolved) return { status: 'skipped' }
  if (!resolved.enabled) return { status: 'suppressed' }
  const name = config.storeName ?? 'Mi Tienda'
  await sendEmail(config, {
    from: `${fromName(name)} <${config.fromEmail}>`,
    to: [params.to],
    subject: resolved.subject,
    html: baseTemplate(templateBodyToHtml(resolved.body), config, locale),
  })
  return { status: 'sent', subject: resolved.subject }
}

/** Envío directo (asunto+HTML ya renderizados). Para correos de prueba (HU-160). */
export async function sendRawEmail(config: EmailConfig, data: { to: string; subject: string; html: string }): Promise<void> {
  const name = config.storeName ?? 'Mi Tienda'
  await sendEmail(config, { from: `${fromName(name)} <${config.fromEmail}>`, to: [data.to], subject: data.subject, html: data.html })
}

/** HU-160 · render de previsualización (no envía): asunto + HTML final. */
export function renderTemplatedPreview(
  type: string,
  vars: Record<string, string | number | null | undefined>,
  override: { subject?: string; body?: string; enabled?: boolean } | null,
  config: EmailConfig,
  locale?: string | null,
): { subject: string; html: string; enabled: boolean } | null {
  const resolved = resolveTemplate(type, vars, override, locale)
  if (!resolved) return null
  return { subject: resolved.subject, html: baseTemplate(templateBodyToHtml(resolved.body), config, mailLocale(locale)), enabled: resolved.enabled }
}

function baseTemplate(content: string, config: EmailConfig, locale: string = DEFAULT_LOCALE): string {
  const name = config.storeName ?? 'Mi Tienda'
  const url  = (config.siteUrl ?? '').replace(/\/$/, '')

  return `<!DOCTYPE html>
<html lang="${esc(locale)}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #fff8ec;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; overflow: hidden; max-width: 600px;">
          <tr>
            <td style="background: #614a2a; padding: 24px 32px; text-align: center;">
              <h1 style="margin: 0; color: #fff8ec; font-size: 24px; letter-spacing: 0.1em;">${esc(name)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">${content}</td>
          </tr>
          <tr>
            <td style="background: #fff0d1; padding: 16px 32px; text-align: center; border-top: 1px solid #f0e8d0;">
              <p style="margin: 0; font-size: 12px; color: #8a6a4a; font-family: sans-serif;">
                ${esc(name)}${url ? ` · <a href="${esc(url)}" style="color: #614a2a;">${url.replace(/^https?:\/\//, '')}</a>` : ''}
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

const P = 'style="margin: 0 0 24px; color: #8a6a4a; font-size: 14px; font-family: sans-serif;"'
const H2 = 'style="margin: 0 0 8px; color: #614a2a; font-size: 20px; font-family: sans-serif;"'
const BTN = 'style="display: inline-block; background: #614a2a; color: #fff8ec; text-decoration: none; padding: 12px 28px; border-radius: 50px; font-size: 14px; font-weight: 600; font-family: sans-serif;"'

/** Línea de cierre "Pedido: ORD-1 · Nombre" en el idioma del correo. */
function orderFooter(t: (k: string, v?: Record<string, string | number>) => string, order: { order_number: string; customer_name: string }): string {
  return `<p style="margin: 0; font-size: 13px; color: #8a6a4a; text-align: center; font-family: sans-serif;">
      ${t('order_line')} <strong>${esc(order.order_number)}</strong> · ${esc(order.customer_name)}
    </p>`
}

/**
 * Notificación al cliente cuando el pedido cambia a "shipped".
 * E28 · HU-465: textos en el idioma del pedido (`order.locale`).
 */
export async function sendShippingNotification(
  order: {
    order_number: string
    customer_email: string
    customer_name: string
    tracking_number?: string | null
    carrier_name?: string | null
    label_url?: string | null
    locale?: string | null
  },
  config: EmailConfig,
): Promise<void> {
  const name = config.storeName ?? 'Mi Tienda'
  const locale = mailLocale(order.locale)
  const t = createTranslator(locale, 'email.system')

  const content = `
    <h2 ${H2}>${t('shipped_title')}</h2>
    <p ${P}>
      ${t('shipped_body', { orderNumber: esc(order.order_number) })}
    </p>
    ${order.tracking_number ? `
    <div style="background: #fff8ec; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
      <p style="margin: 0 0 4px; font-size: 13px; color: #8a6a4a; font-family: sans-serif;">${t('tracking_number')}</p>
      <p style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: #614a2a; letter-spacing: 0.05em; font-family: monospace;">${esc(order.tracking_number)}</p>
      ${order.carrier_name ? `<p style="margin: 0; font-size: 13px; color: #8a6a4a; font-family: sans-serif;">${t('carrier')} <strong>${esc(order.carrier_name)}</strong></p>` : ''}
    </div>
    ${order.label_url ? `
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${esc(order.label_url)}" ${BTN}>
        ${t('download_label')}
      </a>
    </div>` : ''}` : ''}
    ${orderFooter(t, order)}`

  await sendEmail(config, {
    from: `${fromName(name)} <${config.fromEmail}>`,
    to: [order.customer_email],
    subject: t('shipped_subject', { orderNumber: order.order_number, store: name }),
    html: baseTemplate(content, config, locale),
  })
}

/** Notificación al cliente cuando el administrador confirma manualmente el pago (idioma del pedido). */
export async function sendPaymentConfirmed(
  order: {
    order_number: string
    customer_email: string
    customer_name: string
    locale?: string | null
  },
  config: EmailConfig,
): Promise<void> {
  const name = config.storeName ?? 'Mi Tienda'
  const locale = mailLocale(order.locale)
  const t = createTranslator(locale, 'email.system')

  const content = `
    <h2 ${H2}>${t('paid_title')}</h2>
    <p ${P}>
      ${t('paid_body', { orderNumber: esc(order.order_number) })}
    </p>
    ${orderFooter(t, order)}`

  await sendEmail(config, {
    from: `${fromName(name)} <${config.fromEmail}>`,
    to: [order.customer_email],
    subject: t('paid_subject', { orderNumber: order.order_number, store: name }),
    html: baseTemplate(content, config, locale),
  })
}

/** Notificación genérica de cambio de estado — para "delivered" y "cancelled" (idioma del pedido). */
export async function sendStatusNotification(
  order: {
    order_number: string
    customer_email: string
    customer_name: string
    locale?: string | null
  },
  status: 'delivered' | 'cancelled',
  config: EmailConfig,
): Promise<void> {
  const name = config.storeName ?? 'Mi Tienda'
  const locale = mailLocale(order.locale)
  const t = createTranslator(locale, 'email.system')
  const key = status === 'delivered' ? 'delivered' : 'cancelled'

  const content = `
    <h2 ${H2}>${t(`${key}_title`)}</h2>
    <p ${P}>${t(`${key}_body`, { orderNumber: esc(order.order_number) })}</p>
    ${orderFooter(t, order)}`

  await sendEmail(config, {
    from: `${fromName(name)} <${config.fromEmail}>`,
    to: [order.customer_email],
    subject: t(`${key}_subject`, { orderNumber: order.order_number, store: name }),
    html: baseTemplate(content, config, locale),
  })
}

/** HU-105 · aviso de reposición de stock ("avísame cuando vuelva"), en el idioma indicado. */
export async function sendBackInStock(
  data: {
    to: string
    productName: string
    productUrl?: string | null
    variantLabel?: string | null
    locale?: string | null
  },
  config: EmailConfig,
): Promise<void> {
  const name = config.storeName ?? 'Mi Tienda'
  const locale = mailLocale(data.locale)
  const t = createTranslator(locale, 'email.system')
  const label = data.variantLabel ? ` (${data.variantLabel})` : ''

  const content = `
    <h2 ${H2}>${t('restock_title')}</h2>
    <p ${P}>
      ${t('restock_body', { product: esc(data.productName + label) })}
    </p>
    ${data.productUrl ? `
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${esc(data.productUrl)}" ${BTN}>
        ${t('restock_cta')}
      </a>
    </div>` : ''}`

  await sendEmail(config, {
    from: `${fromName(name)} <${config.fromEmail}>`,
    to: [data.to],
    subject: t('restock_subject', { product: data.productName, store: name }),
    html: baseTemplate(content, config, locale),
  })
}

/** HU-292 · invitación a una venta VIP / acceso anticipado, en el idioma indicado. */
export async function sendVipCampaignInvite(
  data: {
    to: string
    campaignName: string
    accessUrl?: string | null
    endsAt?: string | null
    locale?: string | null
  },
  config: EmailConfig,
): Promise<void> {
  const name = config.storeName ?? 'Mi Tienda'
  const locale = mailLocale(data.locale)
  const t = createTranslator(locale, 'email.system')
  const when = data.endsAt ? formatDateTime(data.endsAt, { locale }) : null

  const content = `
    <p style="margin: 0 0 4px; color: #8a6a4a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-family: sans-serif;">${t('vip_kicker')}</p>
    <h2 ${H2}>${esc(data.campaignName)}</h2>
    <p ${P}>
      ${when ? t('vip_body_until', { date: esc(when) }) : t('vip_body')}
    </p>
    ${data.accessUrl ? `
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${esc(data.accessUrl)}" ${BTN}>
        ${t('vip_cta')}
      </a>
    </div>` : ''}`

  await sendEmail(config, {
    from: `${fromName(name)} <${config.fromEmail}>`,
    to: [data.to],
    subject: t('vip_subject', { campaign: data.campaignName, store: name }),
    html: baseTemplate(content, config, locale),
  })
}
