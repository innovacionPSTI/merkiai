/**
 * Unit tests for products query helpers.
 * Supabase client is mocked to avoid real DB calls.
 */

import { getProducts, getProductBySlug, getFeaturedProducts, getBestSellingProducts } from '../products'
import { createServerClient } from '../../client'

jest.mock('../../client')
const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
/**
 * Construye un mock encadenable de Supabase. Cada método de query
 * (select/eq/order/limit) devuelve la misma cadena, y la cadena es
 * "thenable": al hacer `await query` resuelve a `resolvedValue`.
 * Esto refleja el patrón real: `.select().eq('active').order('created_at')`
 * seguido opcionalmente de `.eq('featured', true)` antes del await.
 */
function buildChain(resolvedValue: { data: unknown; error: null | object }) {
  const chain: Record<string, jest.Mock> & { then?: unknown } = {
    select: jest.fn(() => chain),
    eq: jest.fn(() => chain),
    order: jest.fn(() => chain),
    limit: jest.fn(() => chain),
    in: jest.fn(() => chain),
    single: jest.fn().mockResolvedValue(resolvedValue),
  }
  // Hace la cadena "thenable" para queries que no terminan en .single()
  chain.then = (resolve: (v: unknown) => unknown) => resolve(resolvedValue)
  return chain
}

const mockProduct = {
  id: 1,
  slug: 'cafe-huila',
  name: 'Café Huila',
  active: true,
  featured: true,
  category: { id: 1, name: 'Origen Único', slug: 'origen-unico' },
  variants: [
    { id: 10, roast: 'claro', weight: '500g', price: 45000, stock: 20 },
  ],
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ─────────────────────────────────────────────
// getProducts
// ─────────────────────────────────────────────
describe('getProducts', () => {
  it('retorna un arreglo de productos activos', async () => {
    const chain = buildChain({ data: [mockProduct], error: null })
    mockCreateServerClient.mockReturnValue({ from: jest.fn(() => chain) } as never)

    const products = await getProducts()
    expect(products).toHaveLength(1)
    expect(products[0].slug).toBe('cafe-huila')
  })

  it('aplica filtro featured cuando se pasa la opción', async () => {
    const chain = buildChain({ data: [mockProduct], error: null })
    mockCreateServerClient.mockReturnValue({ from: jest.fn(() => chain) } as never)

    await getProducts({ featured: true })
    expect(chain.eq).toHaveBeenCalledWith('featured', true)
  })

  it('lanza un error si Supabase devuelve error', async () => {
    const chain = buildChain({ data: null, error: new Error('DB error') })
    mockCreateServerClient.mockReturnValue({ from: jest.fn(() => chain) } as never)

    await expect(getProducts()).rejects.toThrow('DB error')
  })
})

// ─────────────────────────────────────────────
// getProductBySlug
// ─────────────────────────────────────────────
describe('getProductBySlug', () => {
  it('retorna el producto con el slug indicado', async () => {
    const chain = buildChain({ data: mockProduct, error: null })
    mockCreateServerClient.mockReturnValue({ from: jest.fn(() => chain) } as never)

    const product = await getProductBySlug('cafe-huila')
    expect(product.slug).toBe('cafe-huila')
  })

  it('lanza error si el producto no existe (PGRST116)', async () => {
    const notFoundError = { code: 'PGRST116', message: 'Row not found' }
    const chain = buildChain({ data: null, error: notFoundError })
    mockCreateServerClient.mockReturnValue({ from: jest.fn(() => chain) } as never)

    await expect(getProductBySlug('inexistente')).rejects.toMatchObject({ code: 'PGRST116' })
  })
})

// ─────────────────────────────────────────────
// getFeaturedProducts
// ─────────────────────────────────────────────
describe('getFeaturedProducts', () => {
  it('retorna máximo `limit` productos', async () => {
    const fiveProducts = Array.from({ length: 5 }, (_, i) => ({
      ...mockProduct,
      id: i + 1,
      slug: `product-${i + 1}`,
      featured: true,
    }))

    const chain = buildChain({ data: fiveProducts, error: null })
    mockCreateServerClient.mockReturnValue({ from: jest.fn(() => chain) } as never)

    const products = await getFeaturedProducts(3)
    expect(products).toHaveLength(3)
  })

  it('usa limit = 3 por defecto', async () => {
    const tenProducts = Array.from({ length: 10 }, (_, i) => ({
      ...mockProduct, id: i + 1, slug: `p-${i + 1}`,
    }))

    const chain = buildChain({ data: tenProducts, error: null })
    mockCreateServerClient.mockReturnValue({ from: jest.fn(() => chain) } as never)

    const products = await getFeaturedProducts()
    expect(products).toHaveLength(3)
  })
})

// ─────────────────────────────────────────────
// getBestSellingProducts — agrega desde orders.items (JSONB), sin order_items
// ─────────────────────────────────────────────
describe('getBestSellingProducts', () => {
  function clientByTable(byTable: Record<string, unknown[]>) {
    const make = (resolved: { data: unknown; error: null }) => {
      const chain: Record<string, jest.Mock> & { then?: unknown } = {
        select: jest.fn(() => chain),
        eq:     jest.fn(() => chain),
        in:     jest.fn(() => chain),
        neq:    jest.fn(() => chain),
        order:  jest.fn(() => chain),
        limit:  jest.fn(() => chain),
      }
      chain.then = (resolve: (v: unknown) => unknown) => resolve(resolved)
      return chain
    }
    return { from: (t: string) => make({ data: byTable[t] ?? [], error: null }) }
  }

  it('agrega ventas por producto (variante→producto) y ordena desc', async () => {
    const db = clientByTable({
      orders: [
        { status: 'delivered',  items: [{ variant_id: 10, qty: 2 }, { variant_id: 11, qty: 1 }] },
        { status: 'processing', items: [{ variant_id: 10, qty: 3 }] },
      ],
      product_variants: [{ id: 10, product_id: 1 }, { id: 11, product_id: 2 }],
      products: [
        { id: 1, name: 'A', slug: 'a', images: [{ url: 'ua' }] },
        { id: 2, name: 'B', slug: 'b', images: [] },
      ],
    })
    const res = await getBestSellingProducts(4, db as never)
    expect(res[0]).toMatchObject({ product_id: 1, total_sold: 5, slug: 'a', image_url: 'ua' })
    expect(res.find((r) => r.product_id === 2)?.total_sold).toBe(1)
    expect(res[0].total_sold).toBeGreaterThanOrEqual(res[1].total_sold)
  })

  it('cae a productos recientes si no hay ventas', async () => {
    const db = clientByTable({
      orders: [],
      products: [{ id: 9, name: 'Nuevo', slug: 'nuevo', images: [] }],
    })
    const res = await getBestSellingProducts(4, db as never)
    expect(res).toEqual([
      { product_id: 9, product_name: 'Nuevo', image_url: null, slug: 'nuevo', total_sold: 0 },
    ])
  })
})
