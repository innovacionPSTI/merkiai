import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'

/**
 * Verificación de instancia de ENVÍO (ADR-004 · HU-278). Skydropx requiere un
 * intercambio OAuth para validar; por ahora no hay verificación simple, se
 * valida en la primera cotización. Devuelve supported:false.
 */
export async function POST(_req: NextRequest) {
  const u = await getAdminUser()
  if (!u) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  return NextResponse.json({ ok: false, supported: false, detail: 'verificación automática no disponible' })
}
