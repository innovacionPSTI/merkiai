jest.mock('../products', () => ({ getBestSellingProducts: jest.fn() }))

import { parseSlugList, clampCarouselLimit, normalizeCarouselSource, getCarouselProducts } from '../carousel'
import { getBestSellingProducts } from '../products'

describe('helpers puros', () => {
  it('parseSlugList separa por coma/salto y limpia vacíos', () => {
    expect(parseSlugList('a, b,,c\nd')).toEqual(['a', 'b', 'c', 'd'])
    expect(parseSlugList(['x', ' y '])).toEqual(['x', 'y'])
    expect(parseSlugList(null)).toEqual([])
  })

  it('clampCarouselLimit acota a [1, 24] con default 8', () => {
    expect(clampCarouselLimit(0)).toBe(8)
    expect(clampCarouselLimit('abc')).toBe(8)
    expect(clampCarouselLimit(5)).toBe(5)
    expect(clampCarouselLimit(100)).toBe(24)
  })

  it('normalizeCarouselSource cae a featured si es inválida', () => {
    expect(normalizeCarouselSource('manual')).toBe('manual')
    expect(normalizeCarouselSource('xxx')).toBe('featured')
    expect(normalizeCarouselSource(undefined)).toBe('featured')
  })
})

describe('getCarouselProducts', () => {
  beforeEach(() => jest.clearAllMocks())

  it('manual: respeta el orden de los slugs y deduplica faltantes', async () => {
    const data = [
      { id: 2, slug: 'b', name: 'B', images: [{ url: 'b.jpg' }], min_price: 20 },
      { id: 1, slug: 'a', name: 'A', images: [], min_price: 10 },
    ]
    const inMock = jest.fn().mockResolvedValue({ data })
    const eqMock = jest.fn().mockReturnValue({ in: inMock })
    const select = jest.fn().mockReturnValue({ eq: eqMock })
    const db = { from: jest.fn(() => ({ select })) } as any

    const res = await getCarouselProducts(db, { source: 'manual', slugs: ['a', 'zzz', 'b'] })
    expect(res.map((p) => p.slug)).toEqual(['a', 'b'])
    expect(res[0]).toEqual({ id: 1, slug: 'a', name: 'A', imageUrl: null, price: 10 })
    expect(res[1].imageUrl).toBe('b.jpg')
  })

  it('manual sin slugs → []', async () => {
    const db = { from: jest.fn() } as any
    expect(await getCarouselProducts(db, { source: 'manual', slugs: [] })).toEqual([])
  })

  it('best_selling delega en getBestSellingProducts', async () => {
    ;(getBestSellingProducts as jest.Mock).mockResolvedValue([
      { product_id: 7, product_name: 'Cafe', image_url: 'c.jpg', slug: 'cafe', total_sold: 3 },
    ])
    const db = { from: jest.fn() } as any
    const res = await getCarouselProducts(db, { source: 'best_selling', limit: 4 })
    expect(res).toEqual([{ id: 7, slug: 'cafe', name: 'Cafe', imageUrl: 'c.jpg', price: null }])
  })

  it('category sin slug → []', async () => {
    const db = { from: jest.fn() } as any
    expect(await getCarouselProducts(db, { source: 'category', categorySlug: '' })).toEqual([])
  })
})
