import { NextRequest, NextResponse } from 'next/server'
import { stackServerApp } from '@/stack'
import { getShippingProfile, upsertShippingProfile } from '@merkiai/database'
import { resolveTenant } from '@/lib/tenant-context'
import { getMachineDb } from '@/lib/machine-db'

export async function GET() {
  let user = null
  try { user = await stackServerApp.getUser() } catch { /* no session */ }
  if (!user?.primaryEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { tenantId } = await resolveTenant()
  const profile = await getShippingProfile(user.primaryEmail, getMachineDb(tenantId)).catch(() => null)
  return NextResponse.json(profile ?? null)
}

export async function PUT(request: NextRequest) {
  let user = null
  try { user = await stackServerApp.getUser() } catch { /* no session */ }
  if (!user?.primaryEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { tenantId } = await resolveTenant()
  const profile = await upsertShippingProfile({
    email: user.primaryEmail,
    first_name: body.first_name ?? null,
    last_name: body.last_name ?? null,
    phone: body.phone ?? null,
    address: body.address ?? null,
    city: body.city ?? null,
    department: body.department ?? null,
    postal_code: body.postal_code ?? null,
  }, getMachineDb(tenantId))

  return NextResponse.json(profile)
}
