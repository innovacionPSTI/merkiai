/**
 * Multi-dominio por tenant (HU-279). Capa de datos sobre `tenant_custom_domains`
 * en la BD de plataforma. Reutiliza el núcleo puro `domain-verification`.
 *
 * Nadie la consume aún: la resolución de host, el admin y el aprovisionamiento
 * siguen usando las columnas de `tenants` hasta el cutover. No-breaking.
 */
import {
  normalizeDomain, isValidDomain, makeVerifyToken,
  expectedTxtName, expectedTxtValue, verifyTxt,
} from './domain-verification'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any
export type TxtResolver = (name: string) => Promise<Array<string | string[]>>

export type CustomDomainStatus = 'pending' | 'verified' | 'active'

export interface CustomDomain {
  id: string
  tenantId: string
  domain: string
  status: CustomDomainStatus
  isPrimary: boolean
  verifyToken: string | null
  createdAt: string
}

interface Row {
  id: string; tenant_id: string; domain: string; status: CustomDomainStatus
  is_primary: boolean; verify_token: string | null; created_at: string
}
const toModel = (r: Row): CustomDomain => ({
  id: r.id, tenantId: r.tenant_id, domain: r.domain, status: r.status,
  isPrimary: r.is_primary, verifyToken: r.verify_token, createdAt: r.created_at,
})

/** Lista los dominios de un tenant (el primario primero, luego por antigüedad). */
export async function listDomains(db: Db, tenantId: string): Promise<CustomDomain[]> {
  const { data, error } = await db
    .from('tenant_custom_domains')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map((r: Row) => toModel(r))
}

export interface AddDomainResult {
  ok: boolean; error?: string; id?: string; domain?: string; txtName?: string; txtValue?: string
}

/** Agrega un dominio nuevo (pending + token TXT). No lo activa. */
export async function addDomain(db: Db, tenantId: string, input: string, rng: () => number = Math.random): Promise<AddDomainResult> {
  const domain = normalizeDomain(input)
  if (!isValidDomain(domain)) return { ok: false, error: 'Dominio inválido o no permitido.' }
  const token = makeVerifyToken(rng)
  const { data, error } = await db
    .from('tenant_custom_domains')
    .insert({ tenant_id: tenantId, domain, status: 'pending', verify_token: token, is_primary: false })
    .select('id')
    .single()
  if (error) {
    if ((error as { code?: string }).code === '23505') return { ok: false, error: 'Ese dominio ya está registrado.' }
    return { ok: false, error: error.message }
  }
  return { ok: true, id: data.id, domain, txtName: expectedTxtName(domain), txtValue: expectedTxtValue(token) }
}

/** Verifica la propiedad (TXT) de un dominio → lo deja en `verified`. */
export async function verifyDomain(db: Db, domainId: string, resolveTxt: TxtResolver): Promise<{ ok: boolean; error?: string }> {
  const { data: d } = await db
    .from('tenant_custom_domains')
    .select('domain, verify_token, status')
    .eq('id', domainId)
    .maybeSingle()
  if (!d?.domain || !d?.verify_token) return { ok: false, error: 'Dominio no encontrado o sin token.' }

  let records: Array<string | string[]>
  try { records = await resolveTxt(expectedTxtName(d.domain)) }
  catch { return { ok: false, error: 'No se pudo resolver el TXT (aún propagando).' } }
  if (!verifyTxt(records, d.verify_token)) return { ok: false, error: 'El TXT no coincide todavía.' }

  const { error } = await db.from('tenant_custom_domains').update({ status: 'verified' }).eq('id', domainId)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

/**
 * Marca un dominio verificado como PRIMARIO (canónico) y activo; desmarca el
 * primario anterior (sigue activo como alias). Solo se permite sobre verified/active.
 */
export async function setPrimaryDomain(db: Db, tenantId: string, domainId: string): Promise<{ ok: boolean; error?: string }> {
  const { data: d } = await db
    .from('tenant_custom_domains')
    .select('status').eq('id', domainId).eq('tenant_id', tenantId).maybeSingle()
  if (!d) return { ok: false, error: 'Dominio no encontrado.' }
  if (d.status === 'pending') return { ok: false, error: 'Verifica el dominio antes de hacerlo principal.' }

  const off = await db.from('tenant_custom_domains').update({ is_primary: false }).eq('tenant_id', tenantId).eq('is_primary', true)
  if (off.error) return { ok: false, error: off.error.message }
  const on = await db.from('tenant_custom_domains').update({ is_primary: true, status: 'active' }).eq('id', domainId)
  if (on.error) return { ok: false, error: on.error.message }
  return { ok: true }
}

/** Activa un dominio verificado (resuelve al tenant) SIN marcarlo primario (alias). */
export async function activateDomain(db: Db, tenantId: string, domainId: string): Promise<{ ok: boolean; error?: string }> {
  const { data: d } = await db
    .from('tenant_custom_domains')
    .select('status').eq('id', domainId).eq('tenant_id', tenantId).maybeSingle()
  if (!d) return { ok: false, error: 'Dominio no encontrado.' }
  if (d.status === 'pending') return { ok: false, error: 'Verifica el dominio antes de activarlo.' }
  const { error } = await db.from('tenant_custom_domains').update({ status: 'active' }).eq('id', domainId).eq('tenant_id', tenantId)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

/** Dominio por id (para operaciones de hosting / sync). */
export async function getDomainById(db: Db, tenantId: string, domainId: string): Promise<CustomDomain | null> {
  const { data } = await db
    .from('tenant_custom_domains').select('*').eq('id', domainId).eq('tenant_id', tenantId).maybeSingle()
  return data ? toModel(data as Row) : null
}

/** Quita un dominio. */
export async function removeDomain(db: Db, tenantId: string, domainId: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await db.from('tenant_custom_domains').delete().eq('tenant_id', tenantId).eq('id', domainId)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
