import { SupabaseStorageProvider, getStorageProvider } from '../index'

const DEFAULT = '00000000-0000-0000-0000-000000000001'
const T1 = '11111111-1111-1111-1111-111111111111'
const T2 = '22222222-2222-2222-2222-222222222222'

function fakeClient() {
  const removed: string[][] = []
  const uploaded: { bucket: string; path: string }[] = []
  return {
    removed,
    uploaded,
    storage: {
      from(bucket: string) {
        return {
          async upload(path: string) { uploaded.push({ bucket, path }); return { error: null } },
          async remove(paths: string[]) { removed.push(paths); return { error: null } },
          getPublicUrl(path: string) { return { data: { publicUrl: `https://cdn/${bucket}/${path}` } } },
        }
      },
      async listBuckets() { return { data: [{ name: 'products' }] } },
      async createBucket() { return { error: null } },
    },
  }
}

describe('SupabaseStorageProvider', () => {
  it('sube con el tenantId como prefijo de path y devuelve key estable', async () => {
    const c = fakeClient()
    const p = new SupabaseStorageProvider(c)
    const obj = await p.upload({ tenantId: T1, folder: 'products', filename: 'foto.webp', contentType: 'image/webp', body: new Uint8Array() })
    expect(c.uploaded[0]).toEqual({ bucket: 'products', path: `${T1}/foto.webp` })
    expect(obj.key).toBe(`products/${T1}/foto.webp`)
    expect(obj.url).toContain(`${T1}/foto.webp`)
  })

  it('ownsKey: acepta la clave del propio tenant y rechaza la de otro', () => {
    const p = new SupabaseStorageProvider(fakeClient())
    expect(p.ownsKey(T1, `products/${T1}/x.webp`)).toBe(true)
    expect(p.ownsKey(T1, `products/${T2}/x.webp`)).toBe(false)
  })

  it('ownsKey legacy (sin tenant): solo el tenant por defecto', () => {
    const p = new SupabaseStorageProvider(fakeClient(), DEFAULT)
    expect(p.ownsKey(DEFAULT, 'products/old.webp')).toBe(true)
    expect(p.ownsKey(T1, 'products/old.webp')).toBe(false)
  })

  it('remove bloquea el borrado cruzado', async () => {
    const c = fakeClient()
    const p = new SupabaseStorageProvider(c)
    await expect(p.remove(T1, `products/${T2}/x.webp`)).rejects.toThrow(/borrado cruzado/)
    expect(c.removed).toHaveLength(0)
  })

  it('remove del propio tenant borra el path (sin el bucket)', async () => {
    const c = fakeClient()
    const p = new SupabaseStorageProvider(c)
    await p.remove(T1, `products/${T1}/x.webp`)
    expect(c.removed[0]).toEqual([`${T1}/x.webp`])
  })

  it('factory devuelve el proveedor supabase por defecto', () => {
    expect(getStorageProvider({ client: fakeClient() }).name).toBe('supabase')
  })
})
