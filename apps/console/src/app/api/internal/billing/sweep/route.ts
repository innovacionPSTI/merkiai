/**
 * Barrido de mora (HU-440): suspende suscripciones `past_due` con la gracia vencida.
 * Server-to-server (`x-internal-secret`); pensado para un cron diario.
 */
import { NextRequest, NextResponse } from 'next/server'
import { hasInternalSecret } from '@/lib/auth'
import { platformDb } from '@/lib/platform-db'
import { makeBillingRepo, dunningFromEnv } from '@/lib/billing-runtime'
import { createBillingMailer } from '@/lib/billing-email'
import { sweepDunning } from '@/lib/billing'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!hasInternalSecret(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  try {
    const result = await sweepDunning({
      repo: makeBillingRepo(platformDb()), mailer: createBillingMailer(), policy: dunningFromEnv(), log: (m, x) => console.error(m, x),
    })
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: 'sweep_failed', detail: String((err as Error)?.message ?? err) }, { status: 502 })
  }
}
