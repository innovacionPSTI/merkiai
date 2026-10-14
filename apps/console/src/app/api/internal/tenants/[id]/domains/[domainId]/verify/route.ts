/**
 * Control plane · verifica la propiedad (TXT) de un dominio del tenant (HU-279).
 * POST → si el TXT coincide, deja el dominio en `verified`. Auth: `x-internal-secret`.
 */
import { NextRequest, NextResponse } from 'next/server'
import { resolveTxt } from 'node:dns/promises'
import { platformDb } from '@/lib/platform-db'
import { hasInternalSecret } from '@/lib/auth'
import { verifyDomain } from '@/lib/custom-domains'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; domainId: string }> }) {
  if (!hasInternalSecret(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { domainId } = await params
  const res = await verifyDomain(platformDb(), domainId, (name) => resolveTxt(name))
  return NextResponse.json(res, { status: res.ok ? 200 : 409 })
}
