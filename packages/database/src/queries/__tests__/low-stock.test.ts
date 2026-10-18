import { getLowStockVariants } from '../products'

describe('getLowStockVariants (HU-106)', () => {
  function db(rows: unknown[]) {
    const order = jest.fn().mockResolvedValue({ data: rows })
    const eqBackorder = jest.fn().mockReturnValue({ order })
    const eqActiveP = jest.fn().mockReturnValue({ eq: eqBackorder })
    const lte = jest.fn().mockReturnValue({ eq: eqActiveP })
    const eqActiveV = jest.fn().mockReturnValue({ lte })
    const select = jest.fn().mockReturnValue({ eq: eqActiveV })
    return { db: { from: jest.fn(() => ({ select })) } as any, lte, eqActiveV }
  }

  it('mapea variantes con stock bajo (aplana el producto)', async () => {
    const { db: d, lte } = db([
      { id: 10, sku: 'A1', stock: 0, products: { id: 1, slug: 'cafe', name: 'Cafe', active: true, allow_backorder: false } },
      { id: 11, sku: null, stock: 3, products: [{ id: 2, slug: 'te', name: 'Te', active: true, allow_backorder: false }] },
    ])
    const res = await getLowStockVariants(d, 5)
    expect(lte).toHaveBeenCalledWith('stock', 5)
    expect(res).toEqual([
      { variant_id: 10, product_id: 1, product_name: 'Cafe', slug: 'cafe', sku: 'A1', stock: 0 },
      { variant_id: 11, product_id: 2, product_name: 'Te', slug: 'te', sku: null, stock: 3 },
    ])
  })

  it('umbral inválido → usa 5', async () => {
    const { db: d, lte } = db([])
    await getLowStockVariants(d, NaN as unknown as number)
    expect(lte).toHaveBeenCalledWith('stock', 5)
  })
})
