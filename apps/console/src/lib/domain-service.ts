/**
 * Orquestación del dominio propio (HU-174). Usa el núcleo puro
 * `domain-verification` y la BD de plataforma. El lookup DNS se inyecta para
 * poder testear sin red (en producción: `dns/promises` resolveTxt).
 */
import {
  normalizeDomain, isValidDomain, makeVerifyToken,
  expectedTxtName, expectedTxtValue, verifyTxt,
  expectedDnsRecords, type DnsRecord, type DnsTargets,
} from './domain-verification'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any
export type TxtResolver = (name: string) => Promise<Array<string | string[]>>

export interface DomainRequestResult {
  ok: boolean
  error?: string
  domain?: string
  txtName?: string
  txtValue?: string
  /** Registros A/CNAME para apuntar el dominio a la plataforma (HU-174 v2). */
  dns?: DnsRecord[]
}

/**
 * Registra la solicitud de dominio: valida, normaliza, emite token y deja el
 * tenant en `pending`. Devuelve las instrucciones del registro TXT (propiedad)
 * y los registros A/CNAME (apuntado) a publicar.
 */
export async function requestDomain(
  db: Db, tenantId: string, input: string, rng: () => number = Math.random, targets: DnsTargets = {},
): Promise<DomainRequestResult> {
  const domain = normalizeDomain(input)
  if (!isValidDomain(domain)) return { ok: false, error: 'Dominio inválido o no permitido.' }

  const token = makeVerifyToken(rng)
  const { error } = await db.from('tenants').update({
    domain_requested: domain, domain_verify_token: token, domain_status: 'pending',
  }).eq('id', tenantId)
  if (error) return { ok: false, error: error.message }

  return {
    ok: true, domain,
    txtName: expectedTxtName(domain), txtValue: expectedTxtValue(token),
    dns: expectedDnsRecords(domain, targets),
  }
}

/** Objetivos DNS de la plataforma desde el entorno (Vercel por defecto). */
export function dnsTargetsFromEnv(): DnsTargets {
  return {
    aRecord: process.env.DOMAIN_A_RECORD,
    cnameTarget: process.env.DOMAIN_CNAME_TARGET,
  }
}

export interface DomainVerifyResult {
  ok: boolean
  status?: 'verified' | 'pending'
  error?: string
}

/**
 * Verifica la propiedad: resuelve el TXT del dominio pendiente y lo compara con
 * el token. Si coincide, deja el tenant en `verified` (NO activa `primary_domain`
 * todavía — eso lo hace el PATCH gated). No depende de red: `resolveTxt` se inyecta.
 */
export async function verifyDomain(
  db: Db, tenantId: string, resolveTxt: TxtResolver,
): Promise<DomainVerifyResult> {
  const { data: t } = await db.from('tenants')
    .select('domain_requested, domain_verify_token, domain_status').eq('id', tenantId).maybeSingle()
  if (!t?.domain_requested || !t?.domain_verify_token) {
    return { ok: false, error: 'No hay un dominio pendiente de verificación.' }
  }
  let records: Array<string | string[]> = []
  try {
    records = await resolveTxt(expectedTxtName(t.domain_requested))
  } catch {
    records = []
  }
  if (!verifyTxt(records, t.domain_verify_token)) {
    return { ok: false, status: 'pending', error: 'Aún no se encuentra el registro TXT. Verifica que lo publicaste y espera la propagación DNS.' }
  }
  const { error } = await db.from('tenants').update({ domain_status: 'verified' }).eq('id', tenantId)
  if (error) return { ok: false, error: error.message }
  return { ok: true, status: 'verified' }
}
