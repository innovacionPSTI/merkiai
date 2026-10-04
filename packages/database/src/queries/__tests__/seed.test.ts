import { seedTenantConfig, DEFAULT_HOME_SECTIONS } from '../seed'

const T = '11111111-1111-1111-1111-111111111111'

/**
 * Fake db que soporta:
 *  - upsert (configs + pages)
 *  - select(head/count) sobre page_sections (chequeo de idempotencia)
 *  - insert().select().single() sobre page_sections (devuelve id incremental)
 *  - insert() sobre section_items
 */
function fakeDb(opts: { errorOn?: string | null; existingHomeSections?: number } = {}) {
  const errorOn = opts.errorOn ?? null
  const existing = opts.existingHomeSections ?? 0
  const upserts: { table: string; row: Record<string, unknown>; onConflict: string; ignoreDuplicates: boolean }[] = []
  const inserts: { table: string; rows: Record<string, unknown>[] }[] = []
  let sectionSeq = 100

  return {
    upserts,
    inserts,
    from(table: string) {
      return {
        upsert(row: Record<string, unknown>, o: { onConflict: string; ignoreDuplicates?: boolean }) {
          upserts.push({ table, row, onConflict: o.onConflict, ignoreDuplicates: !!o.ignoreDuplicates })
          return Promise.resolve({ error: errorOn === table ? { message: 'boom' } : null })
        },
        select(_cols: string, o?: { count?: string; head?: boolean }) {
          // Cadena de conteo: .select(...,{head}).eq().eq() → thenable
          const chain = {
            _eq() {
              return chain
            },
            eq() {
              return chain
            },
            then(resolve: (v: unknown) => void) {
              resolve({ count: o?.head ? existing : existing, error: errorOn === table ? { message: 'boom' } : null })
            },
          }
          return chain
        },
        insert(rows: Record<string, unknown> | Record<string, unknown>[]) {
          const arr = Array.isArray(rows) ? rows : [rows]
          inserts.push({ table, rows: arr })
          return {
            select() {
              return {
                single() {
                  const id = ++sectionSeq
                  return Promise.resolve({ data: { id }, error: errorOn === table ? { message: 'boom' } : null })
                },
              }
            },
            then(resolve: (v: unknown) => void) {
              resolve({ error: errorOn === table ? { message: 'boom' } : null })
            },
          }
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

    const tables = db.upserts.map((c) => c.table)
    expect(tables).toEqual(['store_config', 'payment_config', 'shipping_config', 'admin_config', 'pages'])
    for (const c of db.upserts) {
      expect(c.row.tenant_id).toBe(T)
      expect(c.ignoreDuplicates).toBe(true)
    }
    expect(db.upserts[0].row).toMatchObject({ store_name: 'Café Prueba', template: 'default' })
    expect(db.upserts[4].onConflict).toBe('tenant_id,key')
    expect(db.upserts[4].row).toMatchObject({ key: 'home', page_type: 'home' })
    expect(res.results.store_config).toBe('ok')
  })

  it('reporta error por tabla sin abortar el resto', async () => {
    const db = fakeDb({ errorOn: 'payment_config' })
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
    expect(db.upserts[0].row.store_name).toBe('Mi Tienda')
  })

  it('lanza sin tenantId', async () => {
    await expect(seedTenantConfig('', {}, {} as never)).rejects.toThrow(/tenantId/)
  })
})

describe('seedTenantConfig · secciones de arranque del home (HU-234)', () => {
  it('siembra las secciones default con tenant_id y marca sample', async () => {
    const db = fakeDb()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await seedTenantConfig(T, {}, db as any)
    expect(res.results.home_sections).toBe('ok')

    const secInserts = db.inserts.filter((i) => i.table === 'page_sections')
    expect(secInserts).toHaveLength(DEFAULT_HOME_SECTIONS.length)
    for (const ins of secInserts) {
      expect(ins.rows[0].tenant_id).toBe(T)
      expect(ins.rows[0].page_key).toBe('home')
      expect((ins.rows[0].settings as Record<string, unknown>).sample).toBe(true)
    }
    // El hero lleva su slide, con tenant_id, section_id resuelto y sample.
    const itemInserts = db.inserts.filter((i) => i.table === 'section_items')
    expect(itemInserts.length).toBeGreaterThan(0)
    const slide = itemInserts[0].rows[0]
    expect(slide.tenant_id).toBe(T)
    expect(slide.section_id).toBeGreaterThan(100)
    expect((slide.metadata as Record<string, unknown>).sample).toBe(true)
  })

  it('es idempotente: no siembra si el tenant ya tiene secciones de home', async () => {
    const db = fakeDb({ existingHomeSections: 3 })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await seedTenantConfig(T, {}, db as any)
    expect(res.results.home_sections).toMatch(/skipped/)
    expect(db.inserts.filter((i) => i.table === 'page_sections')).toHaveLength(0)
  })

  it('acepta secciones custom (del preset)', async () => {
    const db = fakeDb()
    const custom = [{ section_type: 'hero', title: 'Moda', items: [{ item_type: 'slide', title: 'Nueva colección' }] }]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await seedTenantConfig(T, { homeSections: custom }, db as any)
    const secInserts = db.inserts.filter((i) => i.table === 'page_sections')
    expect(secInserts).toHaveLength(1)
    expect(secInserts[0].rows[0].title).toBe('Moda')
  })
})
