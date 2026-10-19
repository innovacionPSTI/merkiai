import { NextRequest, NextResponse } from 'next/server'
import { listBundles, createBundle } from '@merkiai/database'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { userCanAccess } from '@/lib/roles'

// HU-168 · bundles. Gated por la sección "productos".
async function guard() {
  const adminUser = await getAdminUser()
  if (!adminUser) return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  if (!userCanAccess(adminUser, 'productos')) return { error: NextResponse.json({ error: 'Sin permiso' }, { status: 403 }) }
  return { adminUser, db: getAdminDb(adminUser.tenantId) }
}

export async function GET() {
  const g = await guard()
  if ('error' in g) return g.error
  return NextResponse.json({ bundles: await listBundles(g.db) })
}

export async function POST(req: NextRequest) {
  const g = await guard()
  if ('error' in g) return g.error
  const b = await req.json().catch(() => ({}))
  try {
    const bundle = await createBundle({
      name: String(b.name ?? ''),
      slug: String(b.slug ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
      description: b.description || null,
      price: Number(b.price),
      image_url: b.image_url || null,
      components: Array.isArray(b.components) ? b.components.map((c: any) => ({ variant_id: Number(c.variant_id), qty: Number(c.qty) || 1 })) : [],
    }, g.db, g.adminUser.tenantId)
    return NextResponse.json({ bundle })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 400 })
  }
}
