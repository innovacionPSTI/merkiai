import type { Metadata } from 'next'
import { verifyReceivableLink, type Modality } from '@merkiai/database'
import { resolveTenant } from '@/lib/tenant-context'
import { getMachineDb } from '@/lib/machine-db'
import { formatMoney } from '@merkiai/i18n'
import { getT } from '@/lib/i18n-server'
import { getPageLang } from '@/lib/request-locale'

export const metadata: Metadata = { title: 'Pagar saldo', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'


/**
 * E27 · HU-455 — Página pública para pagar el saldo de un documento de cartera
 * (enlace firmado que envía el comerciante). El estado real lo fija el webhook
 * de la pasarela; esta página solo muestra el saldo y lanza el pago.
 */
export default async function PagarSaldoPage({ searchParams }: { searchParams: Promise<{ d?: string; s?: string; estado?: string; error?: string }> }) {
  const sp = await searchParams
  // E28 · HU-465 · textos y montos en el idioma de la petición.
  const t = await getT('web.balance')
  const locale = await getPageLang().catch(() => 'es-CO')
  const money = (n: number) => formatMoney(n, { locale })
  const { tenantId } = await resolveTenant()
  const documentId = Number(sp.d)
  const valid = verifyReceivableLink(tenantId, documentId, sp.s, process.env.INTERNAL_API_SECRET)

  let doc: { number: string; modality: Modality; balance: number; party: string | null } | null = null
  if (valid) {
    const db = getMachineDb(tenantId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyDb = db as any
    const [{ data: d }, { data: b }] = await Promise.all([
      anyDb.from('receivable_documents').select('number, modality, payment_status, customers(name)').eq('id', documentId).eq('tenant_id', tenantId).maybeSingle(),
      anyDb.from('receivable_document_balances').select('balance').eq('document_id', documentId).maybeSingle(),
    ])
    if (d && d.payment_status !== 'void') {
      const c = Array.isArray(d.customers) ? d.customers[0] : d.customers
      doc = { number: d.number, modality: d.modality, balance: Number(b?.balance ?? 0), party: c?.name ?? null }
    }
  }

  return (
    <div className="bg-brand-cream min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm text-center">
        {!doc ? (
          <>
            <h1 className="font-display text-2xl text-brand-primary mb-2">{t('invalid_title')}</h1>
            <p className="font-brand text-sm text-brand-primary/70">{t('invalid_body')}</p>
          </>
        ) : sp.estado === 'procesando' ? (
          <>
            <h1 className="font-display text-2xl text-brand-primary mb-2">{t('processing_title')}</h1>
            <p className="font-brand text-sm text-brand-primary/70">{t('processing_body')}</p>
          </>
        ) : doc.balance <= 0 ? (
          <>
            <h1 className="font-display text-2xl text-brand-primary mb-2">{t('paid_title')}</h1>
            <p className="font-brand text-sm text-brand-primary/70">{t('paid_body', { number: doc.number })}</p>
          </>
        ) : (
          <>
            <p className="font-brand text-xs uppercase tracking-wide text-brand-primary/50">{t(`modality_${doc.modality}`)} {doc.number}</p>
            <h1 className="font-display text-2xl text-brand-primary mt-1">{doc.party ? t('hello', { name: doc.party }) : t('title')}</h1>
            <p className="font-brand text-sm text-brand-primary/70 mt-3">{t('pending')}</p>
            <p className="font-display text-3xl text-brand-primary">{money(doc.balance)}</p>
            {sp.error && <p role="alert" className="mt-3 font-brand text-sm text-red-600">{sp.error}</p>}
            <form action="/api/receivables/pay" method="post" className="mt-6">
              <input type="hidden" name="d" value={documentId} />
              <input type="hidden" name="s" value={sp.s} />
              <button type="submit" className="w-full rounded-full bg-brand-primary px-6 py-3 font-brand text-sm text-white hover:opacity-90">{t('pay', { amount: money(doc.balance) })}</button>
            </form>
            <p className="mt-3 font-brand text-xs text-brand-primary/50">{t('redirect_note')}</p>
          </>
        )}
      </div>
    </div>
  )
}
