import { seedTenantConfig } from '../seed'

const T = '11111111-1111-1111-1111-111111111111'

function fakeDb(errorOn: string | null = null) {
  const calls: { table: string; row: Record<string, unknown>; onConflict: string; ignoreDuplicates: boolean }[] = []
  return {
    calls,
    from(table: string) {
      return {
        upsert(row: Record<string, unknown>, opts: { onConflict: string; ignoreDuplicates?: boolean }) {
          calls.push({ table, row, onConflict: opts.onConflict, ignoreDuplicates: !!opts.ignoreDuplicates })
          return Promise.resolve({ error: errorOn === table ? { message: 'boom' } : null })
        },
      }
    },
  }
}

describe('seedTenantConfig (HU-207)', () => {
  it('siembra las 4 configs + página home, todas con tenant_id e idempotentes', async () => {
    const db = fakeDb()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await seedTenantConfig(T, { storeName: 'Café Prueba' }, db as any)

    const tables = db.calls.map((c) => c.table)
    expect(tables).toEqual(['store_config', 'payment_config', 'shipping_config', 'admin_config', 'pages'])
    // Todas escriben el tenant y no pisan lo existente.
    for (const c of db.calls) {
      expect(c.row.tenant_id).toBe(T)
      expect(c.ignoreDuplicates).toBe(true)
    }
    // store_config lleva el nombre; pages usa PK compuesta.
    expect(db.calls[0].row).toMatchObject({ store_name: 'Café Prueba', template: 'default' })
    expect(db.calls[4].onConflict).toBe('tenant_id,key')
    expect(db.calls[4].row).toMatchObject({ key: 'home', page_type: 'home' })
    expect(res.results.store_config).toBe('ok')
  })

  it('reporta error por tabla sin abortar el resto', async () => {
    const db = fakeDb('payment_config')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await seedTenantConfig(T, {}, db as any)
    expect(res.results.payment_config).toMatch(/error/)
    expect(res.results.store_config).toBe('ok')
    expect(res.results.pages).toBe('ok') // continuó
  })

  it('usa nombre por defecto si no se pasa', async () => {
    const db = fakeDb()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await seedTenantConfig(T, {}, db as any)
    expect(db.calls[0].row.store_name).toBe('Mi Tienda')
  })

  it('lanza sin tenantId', async () => {
    await expect(seedTenantConfig('')).rejects.toThrow(/tenantId/)
  })
})
