/**
 * Control plane · verificar propiedad del dominio propio (HU-174).
 * POST → resuelve el TXT del dominio pendiente; si coincide, deja `verified`.
 * NO activa `primary_domain` (eso lo hace el PATCH gated). Auth: `x-internal-secret`.
 */
import { NextRequest, NextResponse } from 'next/server'
import { resolveTxt } from 'node:dns/promises'
import { platformDb } from '@/lib/platform-db'
import { hasInternalSecret } from '@/lib/auth'
import { verifyDomain } from '@/lib/domain-service'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!hasInternalSecret(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await params
  const res = await verifyDomain(platformDb(), id, (name) => resolveTxt(name))
  return NextResponse.json(res, { status: res.ok ? 200 : 409 })
}
