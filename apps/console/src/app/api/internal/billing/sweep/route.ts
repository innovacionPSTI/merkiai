/**
 * Barrido diario de cobranza:
 *  - HU-440: suspende suscripciones `past_due` con la gracia vencida.
 *  - HU-441: factura y cobra las comisiones de Merkiai Pagos del mes cerrado
 *    (solo si PayZen está configurado; si no, se informa y se omite).
 *  - E27: dispara la tarea diaria de CARTERA de las tiendas en el admin
 *    (apartados vencidos, vencimientos, recordatorios) — server-to-server.
 *  - `GET`  → Vercel Cron diario (`vercel.json`), autenticado con `CRON_SECRET`.
 *  - `POST` → disparo manual server-to-server (`x-internal-secret`).
 * Idempotente: re-ejecutarlo no suspende dos veces.
 */
import { NextRequest, NextResponse } from 'next/server'
import { hasCronSecret, hasInternalSecret } from '@/lib/auth'
import { platformDb } from '@/lib/platform-db'
import { makeBillingRepo, dunningFromEnv, getBillingProvider } from '@/lib/billing-runtime'
import { getSecretsVault } from '@/lib/vault'
import { collectFees, makeFeeRepo } from '@/lib/fee-collection'
import { createBillingMailer } from '@/lib/billing-email'
import { sweepDunning } from '@/lib/billing'

export const dynamic = 'force-dynamic'

async function run() {
  try {
    const db = platformDb()
    const log = (m: string, x?: unknown) => console.error(m, x)
    const result = await sweepDunning({ repo: makeBillingRepo(db), mailer: createBillingMailer(), policy: dunningFromEnv(), log })
    let fees: unknown
    try {
      fees = await collectFees({ repo: makeFeeRepo(db), provider: getBillingProvider(), vault: getSecretsVault(), log })
    } catch (err) {
      fees = { skipped: String((err as Error)?.message ?? err) }
    }
    // E27 · cartera de las tiendas (vive en la BD de tienda → la ejecuta el admin).
    let receivables: unknown = { skipped: 'ADMIN_APP_URL/INTERNAL_API_SECRET no configurados' }
    const adminUrl = process.env.ADMIN_APP_URL
    if (adminUrl && process.env.INTERNAL_API_SECRET) {
      try {
        const r = await fetch(`${adminUrl.replace(/\/$/, '')}/api/internal/receivables/sweep`, {
          method: 'POST', headers: { 'x-internal-secret': process.env.INTERNAL_API_SECRET }, cache: 'no-store',
        })
        receivables = await r.json().catch(() => ({ status: r.status }))
      } catch (err) {
        receivables = { error: String((err as Error)?.message ?? err) }
      }
    }
    return NextResponse.json({ ...result, fees, receivables })
  } catch (err) {
    return NextResponse.json({ error: 'sweep_failed', detail: String((err as Error)?.message ?? err) }, { status: 502 })
  }
}

export async function GET(req: NextRequest) {
  if (!hasCronSecret(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  return run()
}

export async function POST(req: NextRequest) {
  if (!hasInternalSecret(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  return run()
}
