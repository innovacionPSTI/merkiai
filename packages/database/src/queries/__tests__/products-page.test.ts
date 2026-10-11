/**
 * Unit tests — getProductsPage / getCatalogFacets (HU-270, catálogo server-side).
 * Supabase se mockea: cada from(table) devuelve una cadena "thenable" que
 * resuelve a la siguiente respuesta encolada para esa tabla.
 */
import { getProductsPage, getCatalogFacets, suggestProducts } from '../products'

function makeDb(responses: Record<string, any[]>) {
  const calls: { table: string; ops: any[] }[] = []
  const queues: Record<string, any[]> = {}
  for (const k of Object.keys(responses)) queues[k] = [...responses[k]]

  const from = (table: string) => {
    const resolved = queues[table]?.shift() ?? { data: [], error: null, count: 0 }
    const record = { table, ops: [] as any[] }
    calls.push(record)
    const chain: any = new Proxy(
      {},
      {
        get(_t, prop: string) {
          if (prop === 'then') return (res: (v: any) => any) => res(resolved)
          return (...args: any[]) => { record.ops.push([prop, ...args]); return chain }
        },
      },
    )
    return chain
  }
  return { db: { from } as any, calls }
}

const product = (id: number) => ({ id, slug: `p${id}`, name: `P${id}`, active: true, variants: [], category: null })

describe('getProductsPage', () => {
  it('devuelve productos + total (count) y filtra por categoría + búsqueda', async () => {
    const { db, calls } = makeDb({
      products: [{ data: [product(1), product(2)], error: null, count: 7 }],
    })
    const res = await getProductsPage(db, { search: 'cafe', categoryId: 3, sort: 'precio-asc', limit: 12, offset: 0 })
    expect(res.total).toBe(7)
    expect(res.products).toHaveLength(2)

    const ops = calls.find((c) => c.table === 'products')!.ops.map((o) => o[0])
    expect(ops).toContain('eq')      // active + category_id
    expect(ops).toContain('or')      // búsqueda
    expect(ops).toContain('order')   // orden por min_price
    expect(ops).toContain('range')   // paginación
  })

  it('resuelve atributos por intersección de product_id y usa .in', async () => {
    const { db, calls } = makeDb({
      product_variants: [{ data: [{ product_id: 1 }, { product_id: 2 }], error: null }],
      products: [{ data: [product(1)], error: null, count: 1 }],
    })
    const res = await getProductsPage(db, { attrs: { Color: 'Rojo' }, limit: 12, offset: 0 })
    expect(res.total).toBe(1)
    // product_variants consultado para candidatos; products filtrado con .in
    const prodOps = calls.find((c) => c.table === 'products')!.ops.map((o) => o[0])
    expect(prodOps).toContain('in')
    const pvOps = calls.find((c) => c.table === 'product_variants')!.ops.map((o) => o[0])
    expect(pvOps).toContain('contains')
  })

  it('corta temprano si una faceta no tiene candidatos', async () => {
    const { db } = makeDb({ product_variants: [{ data: [], error: null }] })
    const res = await getProductsPage(db, { attrs: { Color: 'Inexistente' } })
    expect(res).toEqual({ products: [], total: 0 })
  })

  it('aplica filtro de precio por solapamiento (gte max_price / lte min_price)', async () => {
    const { db, calls } = makeDb({ products: [{ data: [product(1)], error: null, count: 1 }] })
    await getProductsPage(db, { minPrice: 1000, maxPrice: 5000 })
    const ops = calls.find((c) => c.table === 'products')!.ops
    expect(ops).toContainEqual(['gte', 'max_price', 1000])
    expect(ops).toContainEqual(['lte', 'min_price', 5000])
  })
})

describe('getCatalogFacets', () => {
  it('arma categorías + atributos con ≥2 valores + límites de precio', async () => {
    const { db } = makeDb({
      categories: [{ data: [{ id: 1, name: 'Ropa' }], error: null }],
      product_variants: [{ data: [
        { attributes: { Color: 'Rojo', Talla: 'M' } },
        { attributes: { Color: 'Azul', Talla: 'M' } },
      ], error: null }],
      // dos consultas de products: min_price asc y max_price desc
      products: [
        { data: [{ min_price: 1500 }], error: null },
        { data: [{ max_price: 99000 }], error: null },
      ],
    })
    const facets = await getCatalogFacets(db)
    expect(facets.categories).toEqual([{ id: 1, name: 'Ropa' }])
    const color = facets.attrFilters.find((f) => f.name === 'Color')
    expect(color?.values.sort()).toEqual(['Azul', 'Rojo'])
    // Talla solo tiene 'M' (1 valor) → se omite
    expect(facets.attrFilters.find((f) => f.name === 'Talla')).toBeUndefined()
    expect(facets.priceBounds).toEqual({ min: 1500, max: 99000 })
  })
})

describe('suggestProducts (HU-102)', () => {
  it('ignora términos de menos de 2 caracteres', async () => {
    const { db, calls } = makeDb({ products: [{ data: [], error: null }] })
    const r = await suggestProducts(db, 'a')
    expect(r).toEqual([])
    expect(calls.length).toBe(0) // ni siquiera consulta
  })

  it('devuelve sugerencias con imagen y precio', async () => {
    const { db, calls } = makeDb({
      products: [{ data: [{ id: 1, name: 'Camiseta', slug: 'camiseta', images: [{ url: 'http://a.jpg' }], min_price: 59900 }], error: null }],
    })
    const r = await suggestProducts(db, 'cami', 6)
    expect(r[0]).toEqual({ id: 1, name: 'Camiseta', slug: 'camiseta', image_url: 'http://a.jpg', min_price: 59900 })
    const ops = calls.find((c) => c.table === 'products')!.ops.map((o) => o[0])
    expect(ops).toContain('or')     // búsqueda name/descr
    expect(ops).toContain('limit')
  })
})
