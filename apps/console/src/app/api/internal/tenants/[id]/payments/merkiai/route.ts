/**
 * Credenciales de "Merkiai Pagos" del tenant (HU-441), para el storefront.
 * Server-to-server (`x-internal-secret`). Descifra la contraseña PayZen en el
 * vault SOLO aquí (control plane); web la usa en memoria para el checkout/IPN.
 * Fail-closed: si el vault no responde → 503 (no se cobra con credenciales dudosas).
 */
import { NextRequest, NextResponse } from 'next/server'
import { hasInternalSecret } from '@/lib/auth'
import { platformDb } from '@/lib/platform-db'
import { getSecretsVault } from '@/lib/vault'
import { getAccount } from '@/lib/merkiai-pagos'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!hasInternalSecret(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  try {
    const acc = await getAccount(platformDb(), id)
    if (!acc || acc.status !== 'active' || !acc.shop_id || !acc.password_ref) return NextResponse.json({ active: false })
    const password = await getSecretsVault().get(acc.password_ref)
    return NextResponse.json({ active: true, provider: acc.provider, environment: acc.environment, credentials: { shop_id: acc.shop_id, password } })
  } catch (err) {
    console.error('[merkiai-pagos] credenciales', String((err as Error)?.message ?? err))
    return NextResponse.json({ error: 'unavailable' }, { status: 503 })
  }
}
