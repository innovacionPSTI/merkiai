import { purgeTenantData } from '../teardown'

const T = '11111111-1111-1111-1111-111111111111'
const DEFAULT = '00000000-0000-0000-0000-000000000001'

function fakeDb(errorOn: string | null = null) {
  const calls: string[] = []
  return {
    calls,
    from(table: string) {
      return {
        delete() {
          return {
            eq(_col: string, _val: string) {
              calls.push(table)
              return Promise.resolve({ error: errorOn === table ? { message: 'boom' } : null })
            },
          }
        },
      }
    },
  }
}

describe('purgeTenantData (HU-209 · borrado)', () => {
  it('borra hijos antes que padres y todas las tablas del tenant', async () => {
    const db = fakeDb()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await purgeTenantData(T, db as any)
    // section_items antes que page_sections antes que pages
    expect(db.calls.indexOf('section_items')).toBeLessThan(db.calls.indexOf('page_sections'))
    expect(db.calls.indexOf('page_sections')).toBeLessThan(db.calls.indexOf('pages'))
    // order_items antes que orders; product_variants antes que products
    expect(db.calls.indexOf('order_items')).toBeLessThan(db.calls.indexOf('orders'))
    expect(db.calls.indexOf('product_variants')).toBeLessThan(db.calls.indexOf('products'))
    // incluye config y profiles
    for (const t of ['store_config', 'payment_config', 'shipping_config', 'admin_config', 'profiles']) {
      expect(db.calls).toContain(t)
      expect(res.results[t]).toBe('ok')
    }
  })

  it('reporta error por tabla sin abortar el resto', async () => {
    const db = fakeDb('orders')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await purgeTenantData(T, db as any)
    expect(res.results.orders).toMatch(/error/)
    expect(res.results.profiles).toBe('ok') // continuó hasta el final
  })

  it('exige tenantId; el default es una tienda más (HU-232: sin trato especial)', async () => {
    await expect(purgeTenantData('', {} as never)).rejects.toThrow(/tenantId/)
    // El tenant por defecto se purga como cualquier otro (sin guard dedicado).
    const db = fakeDb()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await purgeTenantData(DEFAULT, db as any)
    expect(res.results.profiles).toBe('ok')
  })
})
