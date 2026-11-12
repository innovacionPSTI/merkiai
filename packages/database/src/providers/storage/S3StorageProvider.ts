/**
 * S3StorageProvider — StorageProvider sobre cualquier almacenamiento compatible
 * con S3 (HU-432 · ADR-008): **Cloudflare R2** (egreso gratis, recomendado para
 * el storefront), AWS S3, MinIO, etc.
 *
 * Un solo bucket por celda; la clave lleva la carpeta lógica y el tenant:
 *   `<folder>/<tenantId>/<filename>`  → mismo formato que el proveedor Supabase,
 * así `ownsKey` y los registros existentes no cambian al migrar de proveedor.
 *
 * Firma AWS Signature V4 con `node:crypto` (sin SDK → no agrega dependencias).
 * R2 usa la región `auto`. Las URLs públicas salen de `publicBaseUrl` (dominio
 * propio del bucket o r2.dev), nunca del endpoint de la API.
 */
import { createHash, createHmac } from 'crypto'
import type { StorageObject, StorageProvider, StorageUploadInput } from './types'

export interface S3StorageConfig {
  /** Endpoint de la API S3, p. ej. https://<account>.r2.cloudflarestorage.com */
  endpoint: string
  bucket: string
  /** `auto` para R2; región AWS para S3. */
  region: string
  accessKeyId: string
  secretAccessKey: string
  /** Base pública para servir los archivos (CDN/dominio del bucket). */
  publicBaseUrl: string
  /** Slug para logs/registro de uso ('r2' | 's3'). */
  name?: string
}

const sha256Hex = (data: string | Uint8Array) => createHash('sha256').update(data).digest('hex')
const hmac = (key: string | Buffer, data: string) => createHmac('sha256', key).update(data, 'utf8').digest()

/** Clave de firma SigV4 (kSigning). Exportada para probarla contra el vector de AWS. */
export function sigV4SigningKey(secret: string, date: string, region: string, service: string): Buffer {
  return hmac(hmac(hmac(hmac(`AWS4${secret}`, date), region), service), 'aws4_request')
}

/** Codifica cada segmento del path según RFC 3986 (lo que exige SigV4). */
function encodePath(path: string): string {
  return path.split('/').map((s) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)).join('/')
}

export interface SignedRequest { url: string; headers: Record<string, string> }

/**
 * Firma una petición S3 (path-style) con payload ya hasheado. PURO salvo por el
 * reloj, que se inyecta (`now`) para poder probarlo.
 */
export function signS3Request(
  cfg: Pick<S3StorageConfig, 'endpoint' | 'bucket' | 'region' | 'accessKeyId' | 'secretAccessKey'>,
  method: 'PUT' | 'DELETE' | 'GET' | 'HEAD',
  key: string,
  payloadHash: string,
  extraHeaders: Record<string, string> = {},
  now: Date = new Date(),
): SignedRequest {
  const url = new URL(cfg.endpoint)
  const canonicalUri = `/${encodePath(cfg.bucket)}/${encodePath(key)}`
  const amzDate = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '') // YYYYMMDDTHHMMSSZ
  const date = amzDate.slice(0, 8)

  const headers: Record<string, string> = {
    host: url.host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
    ...Object.fromEntries(Object.entries(extraHeaders).map(([k, v]) => [k.toLowerCase(), v.trim()])),
  }
  const names = Object.keys(headers).sort()
  const canonicalHeaders = names.map((n) => `${n}:${headers[n]}\n`).join('')
  const signedHeaders = names.join(';')
  const canonicalRequest = [method, canonicalUri, '', canonicalHeaders, signedHeaders, payloadHash].join('\n')

  const scope = `${date}/${cfg.region}/s3/aws4_request`
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256Hex(canonicalRequest)].join('\n')
  const signature = createHmac('sha256', sigV4SigningKey(cfg.secretAccessKey, date, cfg.region, 's3')).update(stringToSign, 'utf8').digest('hex')

  const { host: _host, ...sendHeaders } = headers
  return {
    url: `${url.origin}${canonicalUri}`,
    headers: {
      ...sendHeaders,
      Authorization: `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    },
  }
}

async function toBytes(body: ArrayBuffer | Uint8Array | Blob): Promise<Uint8Array> {
  if (body instanceof Uint8Array) return body
  if (body instanceof ArrayBuffer) return new Uint8Array(body)
  return new Uint8Array(await body.arrayBuffer())
}

export class S3StorageProvider implements StorageProvider {
  readonly name: string

  constructor(
    private readonly cfg: S3StorageConfig,
    private readonly doFetch: typeof fetch = fetch,
    private readonly now: () => Date = () => new Date(),
  ) {
    this.name = cfg.name ?? 's3'
  }

  ownsKey(tenantId: string, key: string): boolean {
    const parts = key.split('/')
    return parts.length >= 3 && parts[1] === tenantId
  }

  async upload({ tenantId, folder, filename, contentType, body }: StorageUploadInput): Promise<StorageObject> {
    const key = `${folder}/${tenantId}/${filename}`
    const bytes = await toBytes(body)
    const req = signS3Request(this.cfg, 'PUT', key, sha256Hex(bytes), { 'content-type': contentType }, this.now())
    const res = await this.doFetch(req.url, { method: 'PUT', headers: req.headers, body: bytes as unknown as BodyInit })
    if (!res.ok) throw new Error(`[storage:${this.name}] subida falló (${res.status})`)
    return { key, url: `${this.cfg.publicBaseUrl.replace(/\/$/, '')}/${encodePath(key)}` }
  }

  async remove(tenantId: string, key: string): Promise<void> {
    if (!this.ownsKey(tenantId, key)) {
      throw new Error('[storage] La clave no pertenece al tenant (borrado cruzado bloqueado).')
    }
    const req = signS3Request(this.cfg, 'DELETE', key, sha256Hex(''), {}, this.now())
    const res = await this.doFetch(req.url, { method: 'DELETE', headers: req.headers })
    if (!res.ok && res.status !== 404) throw new Error(`[storage:${this.name}] borrado falló (${res.status})`)
  }
}
