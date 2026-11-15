import type { Metadata } from 'next'
import { PageHeader } from '@merkiai/ui'
import { listParties, listStockItems, listLocations, getReceivablesSettings, isModality, listPriceLists } from '@merkiai/database'
import { requireCartera } from '@/lib/cartera'
import NewDocumentForm from './NewDocumentForm'
import { getAdminTx } from '@/lib/ui-locale'

export const metadata: Metadata = { title: 'Nuevo documento · Cartera' }
export const dynamic = 'force-dynamic'

export default async function NuevoDocumentoPage({ searchParams }: { searchParams: Promise<{ modalidad?: string; contraparte?: string }> }) {
  const tx = await getAdminTx()
  const { db, tenantId, consignmentEnabled } = await requireCartera()
  const sp = await searchParams
  const [parties, items, locations, settings, priceLists] = await Promise.all([
    listParties(db, { withBalance: true }).catch(() => []),
    listStockItems(db, { activeOnly: true }).catch(() => []),
    listLocations(db, { activeOnly: true }).catch(() => []),
    getReceivablesSettings(db, tenantId),
    listPriceLists(db, { activeOnly: true }).catch(() => []),
  ])
  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader title={tx("Nuevo documento")} description="Registra una venta a crédito, un encargo, un apartado o una entrega en consignación. Puedes mezclar productos del inventario, servicios y conceptos libres." />
      <NewDocumentForm
        parties={parties.map((p) => ({ id: p.id, name: p.name ?? p.email ?? 'Sin nombre', role: p.party_role, balance: p.balance ?? 0, credit_limit: p.credit_limit }))}
        items={items.filter((i) => i.sellable || i.item_class === 'servicio').map((i) => ({ id: i.id, name: i.name, isService: i.item_class === 'servicio' }))}
        locations={locations.map((l) => ({ id: l.id, name: l.name, kind: l.kind, party_id: (l as unknown as { party_id?: string | null }).party_id ?? null, is_default: l.is_default }))}
        consignmentEnabled={consignmentEnabled}
        defaultDeliveryPolicy={settings.delivery_policy}
        initialModality={isModality(sp.modalidad) ? sp.modalidad : 'special_order'}
        initialParty={sp.contraparte ?? ''}
        priceLists={priceLists.map((l) => ({ id: l.id, name: l.name }))}
      />
    </div>
  )
}
