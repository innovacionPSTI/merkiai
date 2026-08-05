/**
 * Unit tests for products query helpers.
 * Supabase client is mocked to avoid real DB calls.
 */

import { getProducts, getProductBySlug, getFeaturedProducts } from '../products'
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
