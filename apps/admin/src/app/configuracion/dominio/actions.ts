'use server'

import { revalidatePath } from 'next/cache'
import { getAdminUser } from '@/lib/auth'
import { userCanAccess } from '@/lib/roles'
import {
  addCustomDomain, verifyCustomDomain, activateCustomDomain,
  setPrimaryCustomDomain, removeCustomDomain, getDomainProvision,
  type DomainProvision,
} from '@/lib/custom-domains'

export interface DomainResult { ok: boolean; error?: string; message?: string }

async function tenant() {
  const u = await getAdminUser()
  if (!u || !userCanAccess(u, 'configuracion')) return null
  return u.tenantId
}

/** Agrega un dominio nuevo (queda pendiente de verificar con un TXT). */
export async function addDomainAction(domain: string): Promise<DomainResult> {
  const tid = await tenant(); if (!tid) return { ok: false, error: 'No autorizado.' }
  if (!domain.trim()) return { ok: false, error: 'Ingresa un dominio.' }
  const res = await addCustomDomain(tid, domain.trim())
  if (!res.ok) return { ok: false, error: res.error ?? 'No se pudo agregar el dominio.' }
  revalidatePath('/configuracion/dominio')
  return { ok: true, message: 'Dominio agregado. Crea el registro TXT y verifica.' }
}

export async function verifyDomainAction(domainId: string): Promise<DomainResult> {
  const tid = await tenant(); if (!tid) return { ok: false, error: 'No autorizado.' }
  const res = await verifyCustomDomain(tid, domainId)
  revalidatePath('/configuracion/dominio')
  if (!res.ok) return { ok: false, error: res.error ?? 'Aún no se verifica (el TXT puede estar propagando).' }
  return { ok: true, message: 'Dominio verificado. Apunta el A/CNAME y actívalo.' }
}

export async function activateDomainAction(domainId: string): Promise<DomainResult> {
  const tid = await tenant(); if (!tid) return { ok: false, error: 'No autorizado.' }
  const res = await activateCustomDomain(tid, domainId)
  revalidatePath('/configuracion/dominio')
  if (!res.ok) return { ok: false, error: res.error ?? 'No se pudo activar.' }
  return { ok: true, message: 'Dominio activo. El certificado HTTPS puede tardar unos minutos.' }
}

export async function setPrimaryDomainAction(domainId: string): Promise<DomainResult> {
  const tid = await tenant(); if (!tid) return { ok: false, error: 'No autorizado.' }
  const res = await setPrimaryCustomDomain(tid, domainId)
  revalidatePath('/configuracion/dominio')
  if (!res.ok) return { ok: false, error: res.error ?? 'No se pudo marcar como principal.' }
  return { ok: true, message: 'Dominio principal actualizado (canónico de la tienda).' }
}

export async function removeDomainAction(domainId: string): Promise<DomainResult> {
  const tid = await tenant(); if (!tid) return { ok: false, error: 'No autorizado.' }
  const res = await removeCustomDomain(tid, domainId)
  revalidatePath('/configuracion/dominio')
  if (!res.ok) return { ok: false, error: res.error ?? 'No se pudo quitar.' }
  return { ok: true, message: 'Dominio quitado.' }
}

/** Instrucciones DNS + estado de aprovisionamiento de un dominio (bajo demanda). */
export async function domainProvisionAction(domainId: string): Promise<DomainProvision | null> {
  const tid = await tenant(); if (!tid) return null
  return getDomainProvision(tid, domainId)
}
