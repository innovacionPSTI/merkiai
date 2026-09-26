import { NextResponse } from 'next/server'
import { getStoreConfig } from '@merkiai/database';
import { resolveTenant } from '@/lib/tenant-context';
import { getMachineDb } from '@/lib/machine-db'

// Cachear la respuesta 60 s en el CDN / ISR
export const revalidate = 60

export async function GET() {
  try {
    const { tenantId } = await resolveTenant();
    const config = await getStoreConfig(getMachineDb(tenantId), tenantId)
    return NextResponse.json({ maintenance_mode: config.maintenance_mode })
  } catch {
    return NextResponse.json({ maintenance_mode: false })
  }
}
