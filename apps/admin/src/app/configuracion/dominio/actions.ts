'use server'

import { revalidatePath } from 'next/cache'
import { getAdminUser } from '@/lib/auth'
import { canAccess } from '@/lib/roles'
import { requestDomain, verifyDomain, activateDomain, removeDomain, type DomainInstructions } from '@/lib/domains'

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
  // Aviso si el alta en el hosting (Vercel) falló: la tienda sigue en el subdominio.
  if (res.vercel && res.vercel.ok === false) {
    return { ok: true, message: `Dominio activado, pero el alta en el hosting falló (${res.vercel.error ?? 'reintenta'}). Tu tienda sigue disponible en tu subdominio mientras se resuelve.` }
  }
  const prov = res.vercel?.skipped
    ? ' Recuerda dar de alta el dominio en el hosting.'
    : ' El certificado HTTPS puede tardar unos minutos en emitirse.'
  return { ok: true, message: `Dominio activado.${prov}` }
}

/** Quita el dominio propio: la tienda vuelve a su subdominio *.merkiai.com. */
export async function removeDomainAction(_prev: DomainActionState): Promise<DomainActionState> {
  const u = await guard()
  if (!u) return { ok: false, error: 'No autorizado.' }
  const res = await removeDomain(u.tenantId)
  revalidatePath('/configuracion/dominio')
  if (!res.ok) return { ok: false, error: res.error ?? 'No se pudo quitar el dominio.' }
  return { ok: true, message: 'Dominio quitado. Tu tienda responde en tu subdominio *.merkiai.com.' }
}
