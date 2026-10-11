import { listReviews, setReviewStatus, deleteReview } from '@merkiai/database'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { canAccess } from '@/lib/roles'

async function guard() {
  const user = await getAdminUser()
  if (!user || !canAccess(user.role, 'productos')) return null
  return user
}

/** GET → lista reseñas para moderación (opcional ?status=pending|approved|rejected). */
export async function GET(req: NextRequest) {
  const user = await guard()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const status = req.nextUrl.searchParams.get('status') as 'pending' | 'approved' | 'rejected' | null
  const reviews = await listReviews(getAdminDb(user.tenantId), status ?? undefined)
  return NextResponse.json({ reviews })
}

/** PATCH → cambia el estado de una reseña (approve/reject/pending). */
export async function PATCH(req: NextRequest) {
  const user = await guard()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const id = Number(body?.id)
  const status = body?.status
  if (!Number.isInteger(id) || !['approved', 'rejected', 'pending'].includes(status)) {
    return NextResponse.json({ error: 'id/estado inválido' }, { status: 400 })
  }
  const res = await setReviewStatus(getAdminDb(user.tenantId), id, status)
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 500 })
  return NextResponse.json({ ok: true })
}

/** DELETE → elimina una reseña (?id=). */
export async function DELETE(req: NextRequest) {
  const user = await guard()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const id = Number(req.nextUrl.searchParams.get('id'))
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'id inválido' }, { status: 400 })
  const res = await deleteReview(getAdminDb(user.tenantId), id)
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 500 })
  return NextResponse.json({ ok: true })
}
