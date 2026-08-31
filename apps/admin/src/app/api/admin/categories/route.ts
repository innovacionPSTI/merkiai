import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'

export async function GET() {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const supabase = getAdminDb(adminUser.tenantId)
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('order_index')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { name, slug, description, active = true } = body

  if (!name?.trim() || !slug?.trim())
    return NextResponse.json({ error: 'Nombre y slug son requeridos' }, { status: 400 })

  const supabase = getAdminDb(adminUser.tenantId)
  const { data, error } = await supabase
    .from('categories')
    .insert({ name: name.trim(), slug: slug.trim(), description: description ?? null, active, tenant_id: adminUser.tenantId })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
