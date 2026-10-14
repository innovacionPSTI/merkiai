/**
 * Control plane · un dominio del tenant (HU-279).
 *   GET    → instrucciones DNS + estado de aprovisionamiento (TXT + A/CNAME).
 *   DELETE → quita el dominio (unlink del hosting; si era primario, limpia la
 *            columna legacy tenants.primary_domain).
 * Auth: `x-internal-secret`.
 */
import { NextRequest, NextResponse } from 'next/server'
import { platformDb } from '@/lib/platform-db'
import { hasInternalSecret } from '@/lib/auth'
import { getDomainById, removeDomain, listDomains } from '@/lib/custom-domains'
import { expectedTxtName, expectedTxtValue } from '@/lib/domain-verification'
import { getHostingProvider } from '@/lib/hosting'
import { syncPrimaryDomainColumn } from '../_sync'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; domainId: string }> }) {
  if (!hasInternalSecret(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id, domainId } = await params
  const d = await getDomainById(platformDb(), id, domainId)
  if (!d) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  const provision = await getHostingProvider().getStatus(d.domain) // { state, records, active }
  return NextResponse.json({
    id: d.id, domain: d.domain, status: d.status, isPrimary: d.isPrimary,
    ...(d.status === 'pending' && d.verifyToken
      ? { txtName: expectedTxtName(d.domain), txtValue: expectedTxtValue(d.verifyToken) }
      : {}),
    provision,
  })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; domainId: string }> }) {
  if (!hasInternalSecret(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id, domainId } = await params
  const db = platformDb()
  const d = await getDomainById(db, id, domainId)
  if (!d) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const res = await removeDomain(db, id, domainId)
  if (!res.ok) return NextResponse.json(res, { status: 400 })

  // Baja del hosting (idempotente, best-effort).
  const unlink = await getHostingProvider().unlinkDomain(d.domain).catch(() => ({ ok: false }))
  if (!('ok' in unlink) || !unlink.ok) console.warn(`[hosting] unlink ${d.domain} falló (best-effort)`)

  // Si era el primario, el nuevo canónico es el siguiente primario de la tabla (o null).
  if (d.isPrimary) {
    const rest = await listDomains(db, id).catch(() => [])
    const nextPrimary = rest.find((x) => x.isPrimary && x.status === 'active')?.domain ?? null
    await syncPrimaryDomainColumn(db, id, nextPrimary)
  }
  return NextResponse.json({ ok: true })
}
