'use server'

import { localizeForPanel } from '@/lib/server-i18n'
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
async function addDomainAction__impl(domain: string): Promise<DomainResult> {
  const tid = await tenant(); if (!tid) return { ok: false, error: 'No autorizado.' }
  if (!domain.trim()) return { ok: false, error: 'Ingresa un dominio.' }
  const res = await addCustomDomain(tid, domain.trim())
  if (!res.ok) return { ok: false, error: res.error ?? 'No se pudo agregar el dominio.' }
  revalidatePath('/configuracion/dominio')
  return { ok: true, message: 'Dominio agregado. Crea el registro TXT y verifica.' }
}

async function verifyDomainAction__impl(domainId: string): Promise<DomainResult> {
  const tid = await tenant(); if (!tid) return { ok: false, error: 'No autorizado.' }
  const res = await verifyCustomDomain(tid, domainId)
  revalidatePath('/configuracion/dominio')
  if (!res.ok) return { ok: false, error: res.error ?? 'Aún no se verifica (el TXT puede estar propagando).' }
  return { ok: true, message: 'Dominio verificado. Apunta el A/CNAME y actívalo.' }
}

async function activateDomainAction__impl(domainId: string): Promise<DomainResult> {
  const tid = await tenant(); if (!tid) return { ok: false, error: 'No autorizado.' }
  const res = await activateCustomDomain(tid, domainId)
  revalidatePath('/configuracion/dominio')
  if (!res.ok) return { ok: false, error: res.error ?? 'No se pudo activar.' }
  return { ok: true, message: 'Dominio activo. El certificado HTTPS puede tardar unos minutos.' }
}

async function setPrimaryDomainAction__impl(domainId: string): Promise<DomainResult> {
  const tid = await tenant(); if (!tid) return { ok: false, error: 'No autorizado.' }
  const res = await setPrimaryCustomDomain(tid, domainId)
  revalidatePath('/configuracion/dominio')
  if (!res.ok) return { ok: false, error: res.error ?? 'No se pudo marcar como principal.' }
  return { ok: true, message: 'Dominio principal actualizado (canónico de la tienda).' }
}

async function removeDomainAction__impl(domainId: string): Promise<DomainResult> {
  const tid = await tenant(); if (!tid) return { ok: false, error: 'No autorizado.' }
  const res = await removeCustomDomain(tid, domainId)
  revalidatePath('/configuracion/dominio')
  if (!res.ok) return { ok: false, error: res.error ?? 'No se pudo quitar.' }
  return { ok: true, message: 'Dominio quitado.' }
}

/** Instrucciones DNS + estado de aprovisionamiento de un dominio (bajo demanda). */
async function domainProvisionAction__impl(domainId: string): Promise<DomainProvision | null> {
  const tid = await tenant(); if (!tid) return null
  return getDomainProvision(tid, domainId)
}

// HU-466 F6 · los mensajes de cada acción vuelven en el idioma del panel.
export async function addDomainAction(...args: Parameters<typeof addDomainAction__impl>): ReturnType<typeof addDomainAction__impl> {
  return localizeForPanel(await addDomainAction__impl(...args))
}
export async function verifyDomainAction(...args: Parameters<typeof verifyDomainAction__impl>): ReturnType<typeof verifyDomainAction__impl> {
  return localizeForPanel(await verifyDomainAction__impl(...args))
}
export async function activateDomainAction(...args: Parameters<typeof activateDomainAction__impl>): ReturnType<typeof activateDomainAction__impl> {
  return localizeForPanel(await activateDomainAction__impl(...args))
}
export async function setPrimaryDomainAction(...args: Parameters<typeof setPrimaryDomainAction__impl>): ReturnType<typeof setPrimaryDomainAction__impl> {
  return localizeForPanel(await setPrimaryDomainAction__impl(...args))
}
export async function removeDomainAction(...args: Parameters<typeof removeDomainAction__impl>): ReturnType<typeof removeDomainAction__impl> {
  return localizeForPanel(await removeDomainAction__impl(...args))
}
export async function domainProvisionAction(...args: Parameters<typeof domainProvisionAction__impl>): ReturnType<typeof domainProvisionAction__impl> {
  return localizeForPanel(await domainProvisionAction__impl(...args))
}
