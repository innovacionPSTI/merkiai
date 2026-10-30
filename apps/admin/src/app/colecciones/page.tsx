import { redirect, notFound } from 'next/navigation'
import { getAdminUser } from '@/lib/auth'
import { requireAdminDb } from '@/lib/admin-context'
import { listCollections } from '@merkiai/database'
import { FEATURES as FLAGS } from '@/lib/features'
import { getTenantEntitlements } from '@/lib/entitlements'
import { resolveFeature, FEATURES } from '@merkiai/tenancy'
import ColeccionesClient from '@/components/colecciones/ColeccionesClient'

export const dynamic = 'force-dynamic'

/**
 * Colecciones (HU-353) — gestor de tipos de contenido dinámicos + registros.
 * Acceso por entitlement `colecciones` del plan (HU-359) o el flag de dev.
 */
export default async function ColeccionesPage() {
  try { await getAdminUser() } catch { redirect('/sign-in') }

  const { entitlements } = await getTenantEntitlements().catch(() => ({ entitlements: null }))
  const enabled = FLAGS.collections || resolveFeature(entitlements, FEATURES.COLLECTIONS)
  if (!enabled) notFound()

  const { db } = await requireAdminDb()
  const collections = await listCollections(db).catch(() => [])

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="px-6 py-4 border-b border-gray-100">
        <h1 className="font-display text-xl text-brand-primary">Colecciones</h1>
        <p className="font-brand text-xs text-brand-primary/50 mt-0.5">
          Define tipos de contenido reutilizables (noticias, eventos, cursos, personas…) y gestiona sus registros.
        </p>
      </div>
      <div className="flex-1 overflow-y-auto bg-slate-50">
        <ColeccionesClient initialCollections={collections} />
      </div>
    </div>
  )
}
