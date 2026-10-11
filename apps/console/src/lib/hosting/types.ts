/**
 * Abstracción de proveedor de hosting para dominios propios (HU-174 v3).
 *
 * La vinculación de un dominio (alta en el edge/CDN, emisión de certificado,
 * enrutado) NO debe quedar amarrada a un proveedor concreto: según el plan, un
 * sitio puede vivir en la plataforma gestionada (managed) o en una VPS dedicada.
 * Esta interfaz oculta esos detalles; el panel del comerciante solo ve un flujo
 * genérico (registros DNS a crear + estado del aprovisionamiento).
 *
 * Importante: los errores internos (nombres de proveedor, tokens, IDs de
 * proyecto, variables de entorno) NUNCA se exponen al comerciante. Se registran
 * del lado servidor y al panel solo llega un estado/código abstracto.
 */

export type ProvisionState =
  | 'awaiting_dns'   // faltan/propagan los registros DNS del comerciante
  | 'certificate'    // DNS ok; emitiendo certificado HTTPS
  | 'propagating'    // certificado ok; propagando en la CDN
  | 'active'         // sirviendo en el dominio propio
  | 'error'          // fallo de aprovisionamiento (detalle solo en logs)

export interface DnsRecord {
  type: 'A' | 'CNAME' | 'TXT'
  /** Host/nombre del registro ('@' = apex). */
  name: string
  value: string
  /** Para qué sirve (validación de certificado / enrutado). */
  purpose: string
}

export interface ProvisionStatus {
  state: ProvisionState
  /** Registros DNS que el comerciante debe tener publicados. */
  records: DnsRecord[]
  active: boolean
}

/** Resultado abstracto de una operación de aprovisionamiento. */
export interface ProvisionResult {
  ok: boolean
  /** Código abstracto para el panel (nunca texto de infraestructura). */
  code?: 'not_configured' | 'temporarily_unavailable' | 'conflict'
  /** Detalle técnico SOLO para logs del servidor (no se envía al cliente). */
  internalDetail?: string
}

export interface HostingProvider {
  readonly id: string
  /** Da de alta el dominio en la infraestructura (idempotente). */
  linkDomain(domain: string): Promise<ProvisionResult>
  /** Quita el dominio de la infraestructura. */
  unlinkDomain(domain: string): Promise<ProvisionResult>
  /** Estado del aprovisionamiento + registros DNS vigentes. */
  getStatus(domain: string): Promise<ProvisionStatus>
}
