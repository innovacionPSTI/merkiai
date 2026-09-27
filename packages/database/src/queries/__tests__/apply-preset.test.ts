import { applyPresetToStore, type PresetPayload } from '../apply-preset'

const T = '22222222-2222-2222-2222-222222222222'

/**
 * Fake db configurable por tabla. `counts` fija cuántas filas "existen" ya en
 * page_sections/categories/products (para probar idempotencia). `existingTheme`
 * simula que el tenant ya tiene un tema (→ update en vez de insert).
 */
function fakeDb(opts: { counts?: Record<string, number>; existingTheme?: boolean; catRows?: { id: number; slug: string }[] } = {}) {
  const counts = opts.counts ?? {}
  const log = {
    inserts: [] as { table: string; rows: Record<string, unknown>[] }[],
    updates: [] as { table: string; row: Record<string, unknown> }[],
  }
  let seq = 500

  function builder(table: string) {
    const state: { count?: boolean } = {}
    const chain: Record<string, unknown> = {
      select(_c: string, o?: { count?: string; head?: boolean }) {
        state.count = !!o?.head
        return chain
      },
      eq() { return chain },
      limit() { return chain },
      maybeSingle() {
        if (table === 'themes') return Promise.resolve({ data: opts.existingTheme ? { id: 42 } : null, error: null })
        return Promise.resolve({ data: null, error: null })
      },
      single() {
        const id = ++seq
        return Promise.resolve({ data: { id }, error: null })
      },
      update(row: Record<string, unknown>) {
        log.updates.push({ table, row })
        return { eq() { return { eq() { return Promise.resolve({ error: null }) }, then(r: (v: unknown) => void) { r({ error: null }) } } } }
      },
      insert(rows: Record<string, unknown> | Record<string, unknown>[]) {
        const arr = Array.isArray(rows) ? rows : [rows]
        log.inserts.push({ table, rows: arr })
        return {
          select() { return { single: chain.single } },
          then(r: (v: unknown) => void) { r({ error: null }) },
        }
      },
      then(resolve: (v: unknown) => void) {
        // Resolución de select: count-head → {count}; select de categorías → {data}
        if (state.count) return resolve({ count: counts[table] ?? 0, error: null })
        if (table === 'categories') return resolve({ data: opts.catRows ?? [], error: null })
        resolve({ data: [], error: null })
      },
    }
    return chain
  }

  return { log, from: (t: string) => builder(t) }
}

const PRESET: PresetPayload = {
  theme: { name: 'Moda', color_primary: '#0f766e', font_body: 'inter', ignorame: 'x' },
  template: 'boutique',
  home_sections: [{ section_type: 'hero', title: 'H', items: [{ item_type: 'slide', title: 'S' }] }],
  sample_categories: [
    { name: 'Camisas' }, { name: 'Pantalones' }, { name: 'Zapatos' },
  ],
  sample_products: [
    { name: 'Camisa Azul', price: 59900, category_slug: 'camisas', featured: true },
    { name: 'Jean Clásico', price: 89900, category_slug: 'pantalones' },
  ],
}

describe('applyPresetToStore (HU-235)', () => {
  it('lanza sin tenantId', async () => {
    await expect(applyPresetToStore('', PRESET)).rejects.toThrow(/tenantId/)
  })

  it('aplica tema (inserta), template, home, categorías y productos', async () => {
    const db = fakeDb({ catRows: [{ id: 1, slug: 'camisas' }, { id: 2, slug: 'pantalones' }] })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await applyPresetToStore(T, PRESET, {}, db as any)
    expect(res.results).toMatchObject({ theme: 'ok', template: 'ok', home_sections: 'ok', categories: 'ok', products: 'ok' })

    // Tema: insert con solo columnas conocidas (ignora 'ignorame'), is_active + tenant.
    const theme = db.log.inserts.find((i) => i.table === 'themes')!
    expect(theme.rows[0]).toMatchObject({ tenant_id: T, is_active: true, name: 'Moda', color_primary: '#0f766e', font_body: 'inter' })
    expect(theme.rows[0]).not.toHaveProperty('ignorame')

    // Template: update de store_config.
    expect(db.log.updates.find((u) => u.table === 'store_config')?.row).toEqual({ template: 'boutique' })

    // Productos: cada uno con su variante y precio; categoría vinculada por slug.
    const prodInserts = db.log.inserts.filter((i) => i.table === 'products')
    expect(prodInserts).toHaveLength(2)
    expect(prodInserts[0].rows[0]).toMatchObject({ tenant_id: T, category_id: 1, featured: true })
    const variants = db.log.inserts.filter((i) => i.table === 'product_variants')
    expect(variants).toHaveLength(2)
    expect(variants[0].rows[0]).toMatchObject({ tenant_id: T, price: 59900 })
  })

  it('actualiza el tema en vez de insertar si el tenant ya tiene uno', async () => {
    const db = fakeDb({ existingTheme: true })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await applyPresetToStore(T, PRESET, {}, db as any)
    expect(res.results.theme).toBe('ok')
    expect(db.log.updates.some((u) => u.table === 'themes')).toBe(true)
    expect(db.log.inserts.some((i) => i.table === 'themes')).toBe(false)
  })

  it('respeta los límites del plan recortando ejemplos', async () => {
    const db = fakeDb({ catRows: [{ id: 1, slug: 'camisas' }] })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await applyPresetToStore(T, PRESET, { limits: { categories: 1, products: 1 } }, db as any)
    expect(db.log.inserts.find((i) => i.table === 'categories')!.rows).toHaveLength(1)
    expect(db.log.inserts.filter((i) => i.table === 'products')).toHaveLength(1)
  })

  it('no duplica catálogo: salta categorías/productos si ya existen', async () => {
    const db = fakeDb({ counts: { categories: 5, products: 10 } })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await applyPresetToStore(T, PRESET, {}, db as any)
    expect(res.results.categories).toMatch(/skipped/)
    expect(res.results.products).toMatch(/skipped/)
    expect(db.log.inserts.some((i) => i.table === 'categories')).toBe(false)
  })

  it('salta el tema si el preset no lo trae', async () => {
    const db = fakeDb()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await applyPresetToStore(T, { template: 'default' }, {}, db as any)
    expect(res.results.theme).toMatch(/skipped/)
  })
})
