import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader } from '@merkiai/ui'
import { EMAIL_TEMPLATES, listEmailTemplates } from '@merkiai/database'
import { requireAdminDb } from '@/lib/admin-context'
import { userCanAccess } from '@/lib/roles'
import EmailTemplatesEditor from './EmailTemplatesEditor'

export const metadata: Metadata = { title: 'Plantillas de correo' }
export const dynamic = 'force-dynamic'

/**
 * HU-160 · Plantillas de correo editables. El comerciante personaliza el asunto
 * y el cuerpo (con variables) de cada correo transaccional y puede silenciar un
 * tipo. El layout/tema lo pone la app; sin override se usa el default de sistema.
 */
export default async function PlantillasCorreoPage() {
  const { adminUser, db } = await requireAdminDb()
  if (!userCanAccess(adminUser, 'configuracion')) redirect('/no-autorizado')

  const overrides = new Map((await listEmailTemplates(db)).map((o) => [o.type, o]))
  const templates = EMAIL_TEMPLATES.map((def) => {
    const o = overrides.get(def.type)
    return { type: def.type, label: def.label, vars: def.vars, subject: o?.subject ?? def.subject, body: o?.body ?? def.body, enabled: o?.enabled ?? true, customized: !!o }
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plantillas de correo"
        description="Personaliza el asunto y el contenido de cada correo. Usa variables como {{order_number}} o {{customer_name}}. El encabezado y pie se arman con tu marca."
      />
      <EmailTemplatesEditor initial={templates} />
    </div>
  )
}
