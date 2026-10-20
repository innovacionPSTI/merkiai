import { NextRequest, NextResponse } from 'next/server'
import { emailTemplateDef, renderTemplatedPreview, sendRawEmail, resolveEmailConfig } from '@merkiai/database'
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
  const def = emailTemplateDef(String(b.type))
  if (!def) return NextResponse.json({ error: 'Tipo desconocido' }, { status: 400 })

  const db = getAdminDb(adminUser.tenantId)
  const ec = await resolveEmailConfig(db, adminUser.tenantId).catch(() => null)
  const config = { apiKey: ec?.apiKey ?? '', fromEmail: ec?.fromEmail ?? 'noreply@example.com', storeName: ec?.storeName ?? 'Mi Tienda', emailProvider: ec?.provider }

  // Datos de ejemplo para las variables del tipo.
  const sample: Record<string, string> = {
    customer_name: 'Ana Pérez', order_number: 'ORD-0042', total: '$120.000',
    tracking_url: 'https://tracking.example.com/ORD-0042', carrier_name: 'Transportadora', status: 'enviado',
    reset_url: 'https://tu-tienda.com/recuperar?token=demo',
  }
  const vars = Object.fromEntries(def.vars.map((v) => [v, sample[v] ?? `{{${v}}}`]))

  const preview = renderTemplatedPreview(String(b.type), vars, { subject: String(b.subject ?? ''), body: String(b.body ?? ''), enabled: true }, config)
  if (!preview) return NextResponse.json({ error: 'No se pudo renderizar' }, { status: 400 })

  if (b.send === true) {
    if (!ec?.apiKey || !ec?.fromEmail) return NextResponse.json({ error: 'Configura el correo (Configuración → Emails) para enviar pruebas.' }, { status: 400 })
    try {
      await sendRawEmail(config, { to: adminUser.email, subject: `[PRUEBA] ${preview.subject}`, html: preview.html })
      return NextResponse.json({ sent: true, to: adminUser.email })
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : 'Error al enviar' }, { status: 502 })
    }
  }

  return NextResponse.json({ subject: preview.subject, html: preview.html })
}
