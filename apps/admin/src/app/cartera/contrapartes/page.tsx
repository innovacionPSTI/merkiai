import type { Metadata } from 'next'
import { PageHeader } from '@merkiai/ui'
import { listParties, listLocations, listMarkets, marketCountries } from '@merkiai/database'
import { documentTypesFor } from '@merkiai/i18n'
import { requireCartera } from '@/lib/cartera'
import PartiesManager from './PartiesManager'

export const metadata: Metadata = { title: 'Clientes y aliados · Cartera' }
export const dynamic = 'force-dynamic'

export default async function ContrapartesPage() {
  const { db, tenantId, consignmentEnabled } = await requireCartera()
  const [parties, locations] = await Promise.all([
    listParties(db, { withBalance: true }).catch(() => []),
    listLocations(db, { activeOnly: true }).catch(() => []),
  ])
  // HU-468 · tipos de documento del país de la tienda (mercado por defecto).
  const storeCountry = marketCountries(await listMarkets(db, tenantId).catch(() => []))[0] ?? 'CO'
  const documentTypes = documentTypesFor(storeCountry).map((d) => ({ code: d.code, label: d.label }))
  const consLoc = new Map<string, string>()
  for (const l of locations) {
    const pid = (l as unknown as { party_id?: string | null }).party_id
    if (l.kind === 'consignment' && pid) consLoc.set(pid, l.name)
  }
  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader title="Clientes y aliados" description="A quién le vendes a crédito y a quién le dejas mercancía en consignación: cupo, plazo y saldo." />
      <PartiesManager
        consignmentEnabled={consignmentEnabled}
        documentTypes={documentTypes}
        parties={parties.map((p) => ({
          id: p.id, name: p.name ?? p.email ?? 'Sin nombre', email: p.email, phone: p.phone, role: p.party_role,
          credit_limit: p.credit_limit, default_terms_days: p.default_terms_days, balance: p.balance ?? 0,
          consigneeLocation: consLoc.get(p.id) ?? null,
        }))}
      />
    </div>
  )
}
