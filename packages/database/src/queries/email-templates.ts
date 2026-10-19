import type { Db } from '../client'

/**
 * Plantillas de email editables (HU-160). Override por tienda del asunto y el
 * cuerpo de cada correo transaccional, con variables `{{...}}`. Si no hay
 * override, se usa el default de sistema de este catálogo (fallback). La
 * interpolación es pura y testeable; el layout HTML lo renderiza la app.
 */

export type EmailTemplateType =
  | 'payment.confirmed' | 'payment.rejected'
  | 'order.processing' | 'order.shipped' | 'order.delivered' | 'order.cancelled' | 'order.exception'
  | 'account.welcome' | 'account.recovery'

export interface EmailTemplateDef {
  type: EmailTemplateType
  label: string
  /** Variables disponibles para este tipo (para ayuda en el admin). */
  vars: string[]
  subject: string
  body: string
}

/** Catálogo de tipos con defaults de sistema (es). Fuente del fallback. */
export const EMAIL_TEMPLATES: EmailTemplateDef[] = [
  { type: 'payment.confirmed', label: 'Pago confirmado', vars: ['customer_name', 'order_number', 'total'],
    subject: 'Confirmamos tu pago — pedido {{order_number}}',
    body: 'Hola {{customer_name}},\n\nRecibimos tu pago del pedido {{order_number}}. ¡Gracias por tu compra! Te avisaremos cuando lo despachemos.' },
  { type: 'payment.rejected', label: 'Pago rechazado', vars: ['customer_name', 'order_number'],
    subject: 'Tu pago no se pudo procesar — pedido {{order_number}}',
    body: 'Hola {{customer_name}},\n\nNo pudimos procesar el pago del pedido {{order_number}}. Puedes intentar de nuevo o usar otro medio de pago.' },
  { type: 'order.processing', label: 'Pedido en proceso', vars: ['customer_name', 'order_number'],
    subject: 'Tu pedido {{order_number}} está en proceso',
    body: 'Hola {{customer_name}},\n\nEstamos preparando tu pedido {{order_number}}. Pronto tendrás novedades.' },
  { type: 'order.shipped', label: 'Pedido enviado', vars: ['customer_name', 'order_number', 'tracking_url', 'carrier_name'],
    subject: 'Tu pedido {{order_number}} va en camino',
    body: 'Hola {{customer_name}},\n\nTu pedido {{order_number}} fue enviado con {{carrier_name}}. Sigue tu envío aquí: {{tracking_url}}' },
  { type: 'order.delivered', label: 'Pedido entregado', vars: ['customer_name', 'order_number'],
    subject: 'Tu pedido {{order_number}} fue entregado',
    body: 'Hola {{customer_name}},\n\nTu pedido {{order_number}} fue entregado. ¡Esperamos que lo disfrutes!' },
  { type: 'order.cancelled', label: 'Pedido cancelado', vars: ['customer_name', 'order_number'],
    subject: 'Tu pedido {{order_number}} fue cancelado',
    body: 'Hola {{customer_name}},\n\nTu pedido {{order_number}} fue cancelado. Si tienes dudas, contáctanos.' },
  { type: 'order.exception', label: 'Incidencia en el pedido', vars: ['customer_name', 'order_number'],
    subject: 'Hay una novedad con tu pedido {{order_number}}',
    body: 'Hola {{customer_name}},\n\nTuvimos una incidencia con tu pedido {{order_number}}. Nuestro equipo te contactará.' },
  { type: 'account.welcome', label: 'Bienvenida', vars: ['customer_name'],
    subject: '¡Bienvenido/a!',
    body: 'Hola {{customer_name}},\n\nGracias por crear tu cuenta. ¡Te damos la bienvenida!' },
  { type: 'account.recovery', label: 'Recuperar contraseña', vars: ['customer_name', 'reset_url'],
    subject: 'Recupera tu contraseña',
    body: 'Hola {{customer_name}},\n\nPara restablecer tu contraseña entra aquí: {{reset_url}}\n\nSi no fuiste tú, ignora este correo.' },
]

export function emailTemplateDef(type: string): EmailTemplateDef | undefined {
  return EMAIL_TEMPLATES.find((t) => t.type === type)
}

/** Interpola `{{var}}` con los valores dados; variables faltantes → ''. Pura. */
export function renderTemplateString(tpl: string, vars: Record<string, string | number | null | undefined>): string {
  return (tpl ?? '').replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, k: string) => {
    const v = vars[k]
    return v === undefined || v === null ? '' : String(v)
  })
}

export interface ResolvedTemplate { subject: string; body: string; enabled: boolean }

/**
 * Resuelve asunto+cuerpo interpolados para un tipo: usa el override de la tienda
 * si existe, si no el default de sistema. `enabled=false` ⇒ el llamador NO envía.
 * Pura (recibe el override ya leído de BD).
 */
export function resolveTemplate(
  type: string,
  vars: Record<string, string | number | null | undefined>,
  override?: { subject?: string; body?: string; enabled?: boolean } | null,
): ResolvedTemplate | null {
  const def = emailTemplateDef(type)
  const subjectTpl = override?.subject ?? def?.subject
  const bodyTpl = override?.body ?? def?.body
  if (subjectTpl == null || bodyTpl == null) return null
  return {
    subject: renderTemplateString(subjectTpl, vars),
    body: renderTemplateString(bodyTpl, vars),
    enabled: override?.enabled ?? true,
  }
}

// ── Capa de datos ─────────────────────────────────────────────────────────────

export interface EmailTemplateRow { type: string; subject: string; body: string; enabled: boolean; locale: string }

/** Overrides guardados del tenant (merge con el catálogo en el admin). */
export async function listEmailTemplates(db: Db, locale = 'es'): Promise<EmailTemplateRow[]> {
  const { data } = await db.from('email_templates').select('type, subject, body, enabled, locale').eq('locale', locale)
  return (data ?? []) as EmailTemplateRow[]
}

/** Override de un tipo, o null si usa el default. */
export async function getEmailTemplateOverride(db: Db, type: string, locale = 'es'): Promise<EmailTemplateRow | null> {
  const { data } = await db.from('email_templates').select('type, subject, body, enabled, locale').eq('type', type).eq('locale', locale).maybeSingle()
  return (data as EmailTemplateRow) ?? null
}

export async function upsertEmailTemplate(
  input: { type: string; subject: string; body: string; enabled: boolean; locale?: string },
  db: Db,
  tenantId: string,
): Promise<void> {
  if (!emailTemplateDef(input.type)) throw new Error('Tipo de plantilla desconocido.')
  const { error } = await db
    .from('email_templates')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .upsert({ tenant_id: tenantId, type: input.type, locale: input.locale ?? 'es', subject: input.subject, body: input.body, enabled: input.enabled, updated_at: new Date().toISOString() } as any, { onConflict: 'tenant_id,type,locale' })
  if (error) throw error
}
