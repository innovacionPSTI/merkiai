'use server'

import { revalidatePath } from 'next/cache'
import { getAdminUser } from '@/lib/auth'
import { canAccess } from '@/lib/roles'
import { requestDomain, verifyDomain, activateDomain, type DomainInstructions } from '@/lib/domains'

export interface DomainActionState {
  ok: boolean
  error?: string
  message?: string
  instructions?: DomainInstructions
}

async function guard() {
  const u = await getAdminUser()
  if (!u || !canAccess(u.role, 'configuracion')) return null
  return u
}

/** Solicita el dominio propio → deja pending y devuelve las instrucciones TXT. */
export async function requestDomainAction(_prev: DomainActionState, formData: FormData): Promise<DomainActionState> {
  const u = await guard()
  if (!u) return { ok: false, error: 'No autorizado.' }
  const domain = String(formData.get('domain') ?? '').trim()
  if (!domain) return { ok: false, error: 'Ingresa un dominio.' }
  const res = await requestDomain(u.tenantId, domain)
  if (!res.ok) return { ok: false, error: res.error ?? 'No se pudo registrar el dominio.' }
  revalidatePath('/configuracion/dominio')
  return { ok: true, instructions: res, message: 'Dominio registrado. Crea el registro TXT y luego verifica.' }
}

/** Verifica la propiedad (resuelve el TXT). */
export async function verifyDomainAction(_prev: DomainActionState): Promise<DomainActionState> {
  const u = await guard()
  if (!u) return { ok: false, error: 'No autorizado.' }
  const res = await verifyDomain(u.tenantId)
  revalidatePath('/configuracion/dominio')
  if (!res.ok) return { ok: false, error: res.error ?? 'Aún no se verifica el dominio.' }
  return { ok: true, message: 'Dominio verificado. Ya puedes activarlo.' }
}

/** Activa el dominio verificado como dominio principal de la tienda. */
export async function activateDomainAction(_prev: DomainActionState, formData: FormData): Promise<DomainActionState> {
  const u = await guard()
  if (!u) return { ok: false, error: 'No autorizado.' }
  const domain = String(formData.get('domain') ?? '').trim()
  const res = await activateDomain(u.tenantId, domain)
  revalidatePath('/configuracion/dominio')
  if (!res.ok) return { ok: false, error: res.error ?? 'No se pudo activar el dominio.' }
  return { ok: true, message: 'Dominio activado. Tu tienda ya responde en tu dominio propio.' }
}
