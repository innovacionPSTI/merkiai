import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader } from '@merkiai/ui'
import { listQuotes, getProducts } from '@merkiai/database'
import { requireAdminDb } from '@/lib/admin-context'
import { userCanAccess } from '@/lib/roles'
import { getTenantEntitlements } from '@/lib/entitlements'
import { resolveFeature, FEATURES } from '@merkiai/tenancy'
import QuotesManager from './QuotesManager'

export const metadata: Metadata = { title: 'Cotizaciones' }
export const dynamic = 'force-dynamic'

/** E24 · Cotizaciones (HU-408 F2a): pedido en borrador con ciclo de vida y
 *  caducidad. La conversión a orden y el apartado con abonos son Fase 2. */
export default async function CotizacionesPage() {
  const { adminUser, db } = await requireAdminDb()
  if (!userCanAccess(adminUser, 'productos')) redirect('/no-autorizado')
  const { entitlements } = await getTenantEntitlements().catch(() => ({ entitlements: null }))
  if (!resolveFeature(entitlements, FEATURES.QUOTES)) notFound()

  const [quotes, products] = await Promise.all([
    listQuotes(db, { limit: 200 }), getProducts({}, db),
  ])

  return (
    <div className="space-y-6">
      <PageHeader title="Cotizaciones" description="Crea cotizaciones (pedido en borrador) con su vigencia y haz seguimiento de su estado. La conversión a orden y el apartado con abonos llegan en una fase siguiente." />
      <QuotesManager
        quotes={quotes.map((q) => ({ id: q.id, quote_number: q.quote_number, customer_name: q.customer_name, status: q.status, total: q.total, valid_until: q.valid_until, created_at: q.created_at ?? null }))}
        products={products.map((p) => ({ id: p.id, name: p.name, price: p.min_price ?? null }))}
      />
    </div>
  )
}
