/**
 * Utilidades de email para apps/web.
 *
 * Las funciones compartidas (sendShippingNotification, sendStatusNotification,
 * EmailConfig) provienen de @merkiai/database y se re-exportan aquí para que los
 * callers internos no cambien su ruta de importación.
 *
 * Este archivo define únicamente las funciones exclusivas de la tienda web:
 * buildEmailConfig, sendOrderConfirmation, sendNewsletterConfirmation, sendWelcomeEmail.
 */

import type { Order, Db } from '@merkiai/database'
import { alreadySentEmail, retryAsync, recordEmail } from '@merkiai/database'

export type { EmailConfig } from '@merkiai/database'
export { sendShippingNotification, sendStatusNotification } from '@merkiai/database'

import type { EmailConfig } from '@merkiai/database'
import { formatMoney, formatAddressInline, createTranslator, type Translator } from '@merkiai/i18n'

// ── sendEmail helper (privado — solo para funciones web-only) ────────────────

const RESEND_API_URL = 'https://api.resend.com/emails'

async function sendEmail(
  config: EmailConfig,
  payload: { from: string; to: string[]; subject: string; html: string },
): Promise<void> {
  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Resend error ${res.status}: ${err}`)
  }
}

// ── Helpers de plantilla (privados — solo usados en funciones web-only) ──────

function formatCOP(amount: number): string {
  return formatMoney(amount)
}

/** Hardening (XSS en correos): escapa datos de cliente/comerciante antes de insertarlos en HTML. */
function esc(s: unknown): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}
/** Nombre de remitente sin caracteres que rompan la cabecera From. */
function fromName(name: string | null | undefined): string {
  return String(name ?? '').replace(/[<>"\\\r\n]/g, '').trim().slice(0, 80) || 'Mi Tienda'
}

function orderItemsTable(order: Order, tr: Translator = createTranslator(), money: (n: number) => string = formatCOP): string {

  const rows = order.items
    .map(
      (item) => `
    <tr style="border-bottom: 1px solid #f0e8d0;">
      <td style="padding: 10px 0; font-family: sans-serif; font-size: 14px; color: #3d2a1a;">
        <strong>${esc(item.product_name)}</strong><br/>
        <span style="color: #8a6a4a; font-size: 12px;">${esc(item.variant_label)}</span>
      </td>
      <td style="padding: 10px 0; text-align: center; font-family: sans-serif; font-size: 14px; color: #3d2a1a;">${item.qty}</td>
      <td style="padding: 10px 0; text-align: right; font-family: sans-serif; font-size: 14px; color: #3d2a1a;">${money(item.price * item.qty)}</td>
    </tr>`,
    )
    .join('')

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 16px;">
      <thead>
        <tr style="background: #fff8ec;">
          <th style="text-align: left; padding: 8px 0; font-family: sans-serif; font-size: 12px; color: #8a6a4a; text-transform: uppercase; letter-spacing: 0.05em;">${esc(tr('email.order.product'))}</th>
          <th style="text-align: center; padding: 8px 0; font-family: sans-serif; font-size: 12px; color: #8a6a4a; text-transform: uppercase; letter-spacing: 0.05em;">${esc(tr('email.order.qty'))}</th>
          <th style="text-align: right; padding: 8px 0; font-family: sans-serif; font-size: 12px; color: #8a6a4a; text-transform: uppercase; letter-spacing: 0.05em;">${esc(tr('email.order.subtotal'))}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`
}

function baseTemplate(content: string, config: EmailConfig, lang = 'es'): string {
  const name = config.storeName ?? 'Mi Tienda'
  const url  = (config.siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '')

  return `<!DOCTYPE html>
<html lang="${esc(lang)}">
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

// ── Funciones exclusivas de la tienda web ────────────────────────────────────

/** Construye un EmailConfig con siteUrl desde NEXT_PUBLIC_SITE_URL */
export function buildEmailConfig(
  apiKey: string,
  fromEmail: string,
  storeName?: string | null,
  emailProvider?: string | null,
): EmailConfig {
  return {
    apiKey,
    fromEmail,
    storeName: storeName ?? undefined,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    emailProvider: emailProvider ?? 'resend',
  }
}

/** Email de confirmación de pedido — se envía cuando el pago es aprobado */
export async function sendOrderConfirmation(order: Order, config: EmailConfig): Promise<void> {
  const name = config.storeName ?? 'Mi Tienda'
  const addr = order.shipping_addr
  // HU-468 · dirección en el formato de su país (CO conserva el orden histórico).
  const addressText = formatAddressInline(addr, { includeCountry: !!addr.country && addr.country !== 'CO' })
  // E28 · HU-465 · el correo sale en el idioma del pedido (es-CO si no se registró).
  const locale = (order as { locale?: string | null }).locale || 'es-CO'
  const t = createTranslator(locale, 'email.order')
  const tt = createTranslator(locale)
  const money = (n: number) => formatMoney(n, { locale })

  const content = `
    <h2 style="margin: 0 0 8px; color: #614a2a; font-size: 20px; font-family: sans-serif;">${esc(t('title'))}</h2>
    <p style="margin: 0 0 24px; color: #8a6a4a; font-size: 14px; font-family: sans-serif;">
      ${esc(t('body'))}
    </p>
    <div style="background: #fff8ec; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 13px; color: #8a6a4a; font-family: sans-serif;">${esc(t('number'))}</p>
      <p style="margin: 4px 0 0; font-size: 22px; font-weight: 700; color: #614a2a; letter-spacing: 0.05em; font-family: sans-serif;">${order.order_number}</p>
    </div>
    ${orderItemsTable(order, tt, money)}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
      <tr>
        <td style="font-size: 13px; color: #8a6a4a; padding: 4px 0; font-family: sans-serif;">${esc(t('subtotal'))}</td>
        <td style="text-align: right; font-size: 13px; color: #3d2a1a; padding: 4px 0; font-family: sans-serif;">${money(order.subtotal)}</td>
      </tr>
      <tr>
        <td style="font-size: 13px; color: #8a6a4a; padding: 4px 0; font-family: sans-serif;">${esc(t('shipping'))}</td>
        <td style="text-align: right; font-size: 13px; color: #3d2a1a; padding: 4px 0; font-family: sans-serif;">${order.shipping_cost === 0 ? esc(t('free')) : money(order.shipping_cost)}</td>
      </tr>
      <tr style="border-top: 2px solid #f0e8d0;">
        <td style="font-size: 16px; font-weight: 700; color: #614a2a; padding: 10px 0 0; font-family: sans-serif;">${esc(t('total'))}</td>
        <td style="text-align: right; font-size: 16px; font-weight: 700; color: #614a2a; padding: 10px 0 0; font-family: sans-serif;">${money(order.total)}</td>
      </tr>
    </table>
    <div style="background: #fff0d1; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0 0 4px; font-size: 13px; font-weight: 700; color: #614a2a; font-family: sans-serif;">${esc(t('address'))}</p>
      <p style="margin: 0; font-size: 13px; color: #8a6a4a; font-family: sans-serif;">${esc(order.customer_name)}<br/>${esc(addressText)}</p>
    </div>
    <p style="margin: 0; font-size: 13px; color: #8a6a4a; text-align: center; font-family: sans-serif;">
      ${esc(t('tracking'))}
    </p>`

  await sendEmail(config, {
    from: `${fromName(name)} <${config.fromEmail}>`,
    to: [order.customer_email],
    subject: t('subject', { orderNumber: order.order_number, store: name }),
    html: baseTemplate(content, config, locale),
  })
}

const P = 'style="margin: 0 0 16px; color: #8a6a4a; font-size: 14px; font-family: sans-serif;"'
const H2 = 'style="margin: 0 0 8px; color: #614a2a; font-size: 20px; font-family: sans-serif;"'
const BTN = 'style="display: inline-block; background: #614a2a; color: #fff8ec; text-decoration: none; padding: 12px 28px; border-radius: 50px; font-size: 14px; font-weight: 600; font-family: sans-serif;"'

/** Email de confirmación de suscripción al newsletter (E28 · HU-465: en el idioma de la visita). */
export async function sendNewsletterConfirmation(
  to: string,
  config: EmailConfig,
  locale = 'es-CO',
): Promise<void> {
  const name    = config.storeName ?? 'Mi Tienda'
  const siteUrl = (config.siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '')
  const ts = createTranslator(locale, 'email.system')

  const content = `
    <h2 ${H2}>${ts('newsletter_title', { store: esc(name) })}</h2>
    <p ${P}>${ts('newsletter_body')}</p>
    <p style="margin: 0 0 24px; color: #8a6a4a; font-size: 14px; font-family: sans-serif;">${ts('newsletter_body2')}</p>
    ${siteUrl ? `
    <div style="text-align: center;">
      <a href="${esc(siteUrl)}/shop" ${BTN}>
        ${ts('newsletter_cta')}
      </a>
    </div>` : ''}
    <p style="margin: 24px 0 0; color: #8a6a4a; font-size: 12px; font-family: sans-serif; text-align: center;">
      ${ts('newsletter_ignore')}
    </p>`

  await sendEmail(config, {
    from: `${fromName(name)} <${config.fromEmail}>`,
    to: [to],
    subject: ts('newsletter_subject', { store: name }),
    html: baseTemplate(content, config, locale),
  })
}

/** Email de bienvenida al registrarse (E28 · HU-465: en el idioma de la visita). */
export async function sendWelcomeEmail(
  to: string,
  name: string,
  config: EmailConfig,
  locale = 'es-CO',
): Promise<void> {
  const storeName = config.storeName ?? 'Mi Tienda'
  const siteUrl   = (config.siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '')
  const ts = createTranslator(locale, 'email.system')

  const content = `
    <h2 ${H2}>${ts('welcome_title', { store: esc(storeName), name: esc(name) })}</h2>
    <p style="margin: 0 0 24px; color: #8a6a4a; font-size: 14px; font-family: sans-serif;">${ts('welcome_body')}</p>
    ${siteUrl ? `
    <div style="text-align: center;">
      <a href="${esc(siteUrl)}/shop" ${BTN}>
        ${ts('welcome_cta')}
      </a>
    </div>` : ''}`

  await sendEmail(config, {
    from: `${fromName(storeName)} <${config.fromEmail}>`,
    to: [to],
    subject: ts('welcome_subject', { store: storeName }),
    html: baseTemplate(content, config, locale),
  })
}

/**
 * HU-162 · entrega de un correo transaccional del storefront con:
 *  - idempotencia por (tenant, tipo, entidad): si ya se envió, no reenvía;
 *  - reintentos con backoff ante fallos transitorios del proveedor;
 *  - registro en email_log (sent / failed / skipped).
 * Nunca lanza (el flujo de pago/pedido no debe depender del correo).
 * Devuelve el resultado para quien quiera loguearlo.
 */
export async function deliverStorefrontEmail(
  db: Db,
  meta: { tenantId: string; type: string; to: string; entity: string | null; provider?: string | null },
  send: () => Promise<void>,
): Promise<'sent' | 'failed' | 'skipped'> {
  if (await alreadySentEmail(db, { tenantId: meta.tenantId, type: meta.type, entity: meta.entity })) {
    return 'skipped'
  }
  try {
    await retryAsync(send, { attempts: 3 })
    await recordEmail(db, { tenantId: meta.tenantId, to: meta.to, type: meta.type, provider: meta.provider, status: 'sent', entity: meta.entity })
    return 'sent'
  } catch (err) {
    await recordEmail(db, { tenantId: meta.tenantId, to: meta.to, type: meta.type, provider: meta.provider, status: 'failed', entity: meta.entity, error: err instanceof Error ? err.message : String(err) })
    return 'failed'
  }
}
