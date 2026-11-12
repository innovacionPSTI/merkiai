import { S3StorageProvider, sigV4SigningKey, signS3Request } from '../S3StorageProvider'
import { getStorageProvider, s3ConfigFromEnv, isStorageFolder } from '../index'
import { checkStorageQuota } from '../../../queries/storage-usage'

const cfg = {
  endpoint: 'https://acc123.r2.cloudflarestorage.com', bucket: 'merkiai-media', region: 'auto',
  accessKeyId: 'AKID', secretAccessKey: 'SECRET', publicBaseUrl: 'https://media.merkiai.com', name: 'r2',
}
const NOW = new Date('2026-11-12T15:04:05.000Z')

describe('SigV4', () => {
  it('clave de firma = vector oficial de AWS (docs "Deriving the signing key")', () => {
    // AWS: secret wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY, 20120215, us-east-1, iam
    expect(sigV4SigningKey('wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY', '20120215', 'us-east-1', 'iam').toString('hex'))
      .toBe('f4780e2d9f65fa895f9c67b32ce1baf0b0d8a43505a000a1a9e090d414db404d')
  })
  it('firma path-style con fecha, hash del cuerpo y headers firmados', () => {
    const r = signS3Request(cfg, 'PUT', 'products/t1/a b.png', 'abc123', { 'Content-Type': 'image/png' }, NOW)
    expect(r.url).toBe('https://acc123.r2.cloudflarestorage.com/merkiai-media/products/t1/a%20b.png')
    expect(r.headers['x-amz-date']).toBe('20261112T150405Z')
    expect(r.headers['x-amz-content-sha256']).toBe('abc123')
    expect(r.headers.Authorization).toMatch(/^AWS4-HMAC-SHA256 Credential=AKID\/20261112\/auto\/s3\/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=[0-9a-f]{64}$/)
    // Determinista: misma entrada → misma firma
    expect(signS3Request(cfg, 'PUT', 'products/t1/a b.png', 'abc123', { 'Content-Type': 'image/png' }, NOW).headers.Authorization).toBe(r.headers.Authorization)
  })
})

describe('S3StorageProvider', () => {
  it('sube con clave <folder>/<tenant>/<file> y URL pública del CDN', async () => {
    const f = jest.fn(async () => ({ ok: true, status: 200 }))
    const p = new S3StorageProvider(cfg, f as unknown as typeof fetch, () => NOW)
    const o = await p.upload({ tenantId: 't1', folder: 'products', filename: 'x.png', contentType: 'image/png', body: new Uint8Array([1, 2, 3]) })
    expect(o).toEqual({ key: 'products/t1/x.png', url: 'https://media.merkiai.com/products/t1/x.png' })
    const [url, init] = (f.mock.calls[0] as unknown as [string, RequestInit])
    expect(url).toBe('https://acc123.r2.cloudflarestorage.com/merkiai-media/products/t1/x.png')
    expect(init.method).toBe('PUT')
    expect((init.headers as Record<string, string>)['content-type']).toBe('image/png')
  })
  it('error del proveedor → lanza', async () => {
    const p = new S3StorageProvider(cfg, (async () => ({ ok: false, status: 403 })) as unknown as typeof fetch)
    await expect(p.upload({ tenantId: 't1', folder: 'media', filename: 'x', contentType: 'image/png', body: new Uint8Array() })).rejects.toThrow(/403/)
  })
  it('borrado: bloquea claves de otro tenant; 404 es idempotente', async () => {
    const f = jest.fn(async () => ({ ok: false, status: 404 }))
    const p = new S3StorageProvider(cfg, f as unknown as typeof fetch)
    await expect(p.remove('t2', 'products/t1/x.png')).rejects.toThrow(/cruzado/)
    await expect(p.remove('t1', 'products/t1/x.png')).resolves.toBeUndefined()
    expect((f.mock.calls[0] as unknown as [string, RequestInit])[1].method).toBe('DELETE')
  })
})

describe('factory y configuración', () => {
  it('R2 desde env (región auto por defecto); incompleto → null', () => {
    const env = { STORAGE_PROVIDER: 'r2', STORAGE_S3_ENDPOINT: cfg.endpoint, STORAGE_S3_BUCKET: 'b', STORAGE_S3_ACCESS_KEY_ID: 'a', STORAGE_S3_SECRET_ACCESS_KEY: 's', STORAGE_PUBLIC_BASE_URL: 'https://m' }
    expect(s3ConfigFromEnv(env)).toMatchObject({ region: 'auto', name: 'r2', bucket: 'b' })
    expect(s3ConfigFromEnv({ ...env, STORAGE_S3_BUCKET: undefined })).toBeNull()
  })
  it('r2 sin config → lanza (fail-closed); supabase por defecto', () => {
    expect(() => getStorageProvider({ provider: 'r2', s3: null })).toThrow(/configuración/)
    expect(getStorageProvider({ provider: 'r2', s3: cfg }).name).toBe('r2')
    expect(getStorageProvider({ client: {} }).name).toBe('supabase')
  })
  it('solo carpetas conocidas', () => {
    expect(isStorageFolder('products')).toBe(true)
    expect(isStorageFolder('../otro')).toBe(false)
    expect(isStorageFolder('cualquier-bucket')).toBe(false)
  })
})

describe('checkStorageQuota', () => {
  const MB = 1024 * 1024
  it('sin límite → ok; dentro → ok; excede → mensaje claro', () => {
    expect(checkStorageQuota(999 * MB, MB, null).ok).toBe(true)
    expect(checkStorageQuota(90 * MB, 10 * MB, 100).ok).toBe(true)
    const r = checkStorageQuota(95 * MB, 10 * MB, 100)
    expect(r.ok).toBe(false)
    expect(r.message).toMatch(/100 MB/)
    expect(r.message).toMatch(/95 MB/)
  })
})
