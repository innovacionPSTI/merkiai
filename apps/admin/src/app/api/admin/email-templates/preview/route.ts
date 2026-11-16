import { NextRequest } from 'next/server'
import { NextResponse } from '@/lib/api-response'
import { emailTemplateDef, emailTemplateLanguage, renderTemplatedPreview, sendRawEmail, resolveEmailConfig, listMarkets, defaultMarket } from '@merkiai/database'
import { formatMoney } from '@merkiai/i18n'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { userCanAccess } from '@/lib/roles'

// HU-160 · previsualización (y correo de prueba) de una plantilla con los valores
// que el admin está editando. `send=true` envía al correo del propio admin.
export async function POST(req: NextRequest) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!userCanAccess(adminUser, 'configuracion')) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })

  const b = await req.json().catch(() => ({}))
  const def = emailTemplateDef(String(b.type), b.locale)
  if (!def) return NextResponse.json({ error: 'Tipo desconocido' }, { status: 400 })

  const db = getAdminDb(adminUser.tenantId)
  const ec = await resolveEmailConfig(db, adminUser.tenantId).catch(() => null)
  const config = { apiKey: ec?.apiKey ?? '', fromEmail: ec?.fromEmail ?? 'noreply@example.com', storeName: ec?.storeName ?? 'Mi Tienda', emailProvider: ec?.provider }

  // Datos de ejemplo (genéricos) para las variables del tipo, en el idioma de la plantilla.
  const lang = emailTemplateLanguage(b.locale)
  const locale = lang === 'en' ? 'en-US' : 'es-CO'
  const currency = await listMarkets(db, adminUser.tenantId).then((m) => defaultMarket(m).currency).catch(() => 'COP')
  const en = lang === 'en'
  const sample: Record<string, string> = {
    customer_name: en ? 'Sample customer' : 'Cliente de ejemplo', order_number: 'ORD-0042', total: formatMoney(120000, { currency, locale }),
    tracking_url: 'https://tracking.example.com/ORD-0042', carrier_name: en ? 'Carrier' : 'Transportadora', status: en ? 'shipped' : 'enviado',
    reset_url: 'https://example.com/reset?token=demo',
  }
  const vars = Object.fromEntries(def.vars.map((v) => [v, sample[v] ?? `{{${v}}}`]))

  const preview = renderTemplatedPreview(String(b.type), vars, { subject: String(b.subject ?? ''), body: String(b.body ?? ''), enabled: true }, config, locale)
  if (!preview) return NextResponse.json({ error: 'No se pudo renderizar' }, { status: 400 })

  if (b.send === true) {
    if (!ec?.apiKey || !ec?.fromEmail) return NextResponse.json({ error: 'Configura el correo (Configuración → Emails) para enviar pruebas.' }, { status: 400 })
    try {
      await sendRawEmail(config, { to: adminUser.email, subject: `${en ? '[TEST]' : '[PRUEBA]'} ${preview.subject}`, html: preview.html })
      return NextResponse.json({ sent: true, to: adminUser.email })
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : 'Error al enviar' }, { status: 502 })
    }
  }

  return NextResponse.json({ subject: preview.subject, html: preview.html })
}
