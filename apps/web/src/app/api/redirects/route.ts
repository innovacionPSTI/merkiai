import { NextResponse } from 'next/server'
import { listActiveRedirects } from '@merkiai/database'
import { resolveTenant } from '@/lib/tenant-context'
import { getMachineDb } from '@/lib/machine-db'

// Reglas de redirect activas del tenant (HU-113). El middleware las consulta y
// cachea en memoria; se revalidan cada 60 s.
export const revalidate = 60

export async function GET() {
  try {
    const { tenantId } = await resolveTenant()
    const rules = await listActiveRedirects(getMachineDb(tenantId))
    return NextResponse.json({
      redirects: rules.map((r) => ({ from_path: r.from_path, to_path: r.to_path, status_code: r.status_code })),
    })
  } catch {
    return NextResponse.json({ redirects: [] })
  }
}
