import { getProductsStockMap, getWishlist, addWishlistItems, removeWishlistItem } from '../wishlist'

describe('getProductsStockMap', () => {
  it('[] si no hay ids válidos', async () => {
    const db = { from: jest.fn() } as any
    expect(await getProductsStockMap(db, [])).toEqual({})
  })

  it('backorder o variante activa con stock → disponible; agotado si no', async () => {
    const data = [
      { id: 1, allow_backorder: false, product_variants: [{ stock: 0, active: true }, { stock: 5, active: false }] }, // agotado
      { id: 2, allow_backorder: false, product_variants: [{ stock: 3, active: true }] },                               // disponible
      { id: 3, allow_backorder: true,  product_variants: [] },                                                         // backorder → disponible
    ]
    const inMock = jest.fn().mockResolvedValue({ data })
    const eqMock = jest.fn().mockReturnValue({ in: inMock })
    const select = jest.fn().mockReturnValue({ eq: eqMock })
    const db = { from: jest.fn(() => ({ select })) } as any

    expect(await getProductsStockMap(db, [1, 2, 3, 1])).toEqual({ 1: false, 2: true, 3: true })
  })
})

describe('getWishlist', () => {
  it('[] si el cliente no tiene favoritos', async () => {
    const order = jest.fn().mockResolvedValue({ data: [] })
    const eq = jest.fn().mockReturnValue({ order })
    const select = jest.fn().mockReturnValue({ eq })
    const db = { from: jest.fn(() => ({ select })) } as any
    expect(await getWishlist(db, 'c1')).toEqual([])
  })

  it('preserva el orden de la wishlist y calcula disponibilidad', async () => {
    const order = jest.fn().mockResolvedValue({ data: [{ product_id: 2 }, { product_id: 1 }] })
    const eqW = jest.fn().mockReturnValue({ order })
    const selectW = jest.fn().mockReturnValue({ eq: eqW })

    const products = [
      { id: 1, slug: 'a', name: 'A', images: [], min_price: 10, allow_backorder: false, product_variants: [{ stock: 0, active: true }] },
      { id: 2, slug: 'b', name: 'B', images: [{ url: 'b.jpg' }], min_price: 20, allow_backorder: false, product_variants: [{ stock: 2, active: true }] },
    ]
    const inP = jest.fn().mockResolvedValue({ data: products })
    const eqP = jest.fn().mockReturnValue({ in: inP })
    const selectP = jest.fn().mockReturnValue({ eq: eqP })

    let call = 0
    const db = { from: jest.fn(() => (call++ === 0 ? { select: selectW } : { select: selectP })) } as any

    const res = await getWishlist(db, 'c1')
    expect(res.map((r) => r.id)).toEqual([2, 1])
    expect(res[0]).toEqual({ id: 2, slug: 'b', name: 'B', imageUrl: 'b.jpg', price: 20, inStock: true })
    expect(res[1].inStock).toBe(false)
  })
})

describe('addWishlistItems / removeWishlistItem', () => {
  it('upsert bulk con dedup e ignoreDuplicates', async () => {
    const upsert = jest.fn().mockResolvedValue({ error: null })
    const db = { from: jest.fn(() => ({ upsert })) } as any
    await addWishlistItems(db, 'c1', [5, 5, 7, -1], 't1')
    expect(upsert).toHaveBeenCalledWith(
      [{ tenant_id: 't1', customer_id: 'c1', product_id: 5 }, { tenant_id: 't1', customer_id: 'c1', product_id: 7 }],
      { onConflict: 'tenant_id,customer_id,product_id', ignoreDuplicates: true },
    )
  })

  it('no llama a la BD si no hay ids válidos', async () => {
    const upsert = jest.fn()
    const db = { from: jest.fn(() => ({ upsert })) } as any
    await addWishlistItems(db, 'c1', [], 't1')
    expect(upsert).not.toHaveBeenCalled()
  })

  it('remove filtra por customer + product', async () => {
    const eq2 = jest.fn().mockResolvedValue({ error: null })
    const eq1 = jest.fn().mockReturnValue({ eq: eq2 })
    const del = jest.fn().mockReturnValue({ eq: eq1 })
    const db = { from: jest.fn(() => ({ delete: del })) } as any
    await removeWishlistItem(db, 'c1', 9)
    expect(eq1).toHaveBeenCalledWith('customer_id', 'c1')
    expect(eq2).toHaveBeenCalledWith('product_id', 9)
  })
})
