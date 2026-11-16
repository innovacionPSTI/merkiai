import { NextRequest } from 'next/server'
import { NextResponse } from '@/lib/api-response'
import { emailTemplatesFor, emailTemplateLanguage, listEmailTemplates, upsertEmailTemplate } from '@merkiai/database'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { userCanAccess } from '@/lib/roles'

// HU-160 · plantillas de email. Gated por la sección "configuracion".
// E28 · HU-465 · por idioma (`?locale=en`): cada idioma tiene sus overrides y sus defaults.
async function guard() {
  const adminUser = await getAdminUser()
  if (!adminUser) return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  if (!userCanAccess(adminUser, 'configuracion')) return { error: NextResponse.json({ error: 'Sin permiso' }, { status: 403 }) }
  return { adminUser, db: getAdminDb(adminUser.tenantId) }
}

// Catálogo fusionado: default de sistema del idioma + override guardado por tipo.
export async function GET(req: NextRequest) {
  const g = await guard()
  if ('error' in g) return g.error
  const lang = emailTemplateLanguage(req.nextUrl.searchParams.get('locale'))
  const overrides = new Map((await listEmailTemplates(g.db, lang)).map((o) => [o.type, o]))
  const templates = emailTemplatesFor(lang).map((def) => {
    const o = overrides.get(def.type)
    return {
      type: def.type, label: def.label, vars: def.vars,
      subject: o?.subject ?? def.subject,
      body: o?.body ?? def.body,
      enabled: o?.enabled ?? true,
      customized: !!o,
    }
  })
  return NextResponse.json({ locale: lang, templates })
}

export async function POST(req: NextRequest) {
  const g = await guard()
  if ('error' in g) return g.error
  const b = await req.json().catch(() => ({}))
  try {
    await upsertEmailTemplate(
      { type: String(b.type), subject: String(b.subject ?? ''), body: String(b.body ?? ''), enabled: b.enabled !== false, locale: emailTemplateLanguage(b.locale) },
      g.db, g.adminUser.tenantId,
    )
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 400 })
  }
}
