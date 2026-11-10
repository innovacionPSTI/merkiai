/**
 * Barrido de mora (HU-440): suspende suscripciones `past_due` con la gracia vencida.
 *  - `GET`  → Vercel Cron diario (`vercel.json`), autenticado con `CRON_SECRET`.
 *  - `POST` → disparo manual server-to-server (`x-internal-secret`).
 * Idempotente: re-ejecutarlo no suspende dos veces.
 */
import { NextRequest, NextResponse } from 'next/server'
import { hasCronSecret, hasInternalSecret } from '@/lib/auth'
import { platformDb } from '@/lib/platform-db'
import { makeBillingRepo, dunningFromEnv } from '@/lib/billing-runtime'
import { createBillingMailer } from '@/lib/billing-email'
import { sweepDunning } from '@/lib/billing'

export const dynamic = 'force-dynamic'

async function run() {
  try {
    const result = await sweepDunning({
      repo: makeBillingRepo(platformDb()), mailer: createBillingMailer(), policy: dunningFromEnv(), log: (m, x) => console.error(m, x),
    })
    return NextResponse.json(result)
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
