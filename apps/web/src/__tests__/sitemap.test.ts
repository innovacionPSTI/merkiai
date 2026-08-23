/**
 * @jest-environment node
 */
/**
 * Unit tests for app/sitemap.ts
 *
 * Verifies that the sitemap includes static routes, active products only,
 * and published blog posts only — and handles DB failures gracefully.
 */

// sitemap.ts lee NEXT_PUBLIC_SITE_URL al importarse; debe estar seteado antes del import
process.env.NEXT_PUBLIC_SITE_URL = 'https://shop.example.com'

// ── Mocks ────────────────────────────────────────────────────────────────────
jest.mock('@merkiai/database', () => ({
  getProducts:  jest.fn(),
  getBlogPosts: jest.fn(),
}))

import { getProducts, getBlogPosts } from '@merkiai/database'
import sitemap from '../app/sitemap'

const mockGetProducts  = getProducts  as jest.MockedFunction<typeof getProducts>
const mockGetBlogPosts = getBlogPosts as jest.MockedFunction<typeof getBlogPosts>

const BASE = 'https://shop.example.com'

beforeEach(() => jest.clearAllMocks())

// ─────────────────────────────────────────────────────────────────────────────
describe('sitemap — rutas estáticas', () => {
  beforeEach(() => {
    mockGetProducts.mockResolvedValue([])
    mockGetBlogPosts.mockResolvedValue([])
  })

  it('incluye la página de inicio con priority 1.0', async () => {
    const routes = await sitemap()
    const home = routes.find((r) => r.url === BASE)
    expect(home).toBeDefined()
    expect(home?.priority).toBe(1.0)
  })

  it('incluye /shop y /blog', async () => {
    const routes = await sitemap()
    const urls = routes.map((r) => r.url)
    expect(urls).toContain(`${BASE}/shop`)
    expect(urls).toContain(`${BASE}/blog`)
  })

  it('incluye /terms y /privacy', async () => {
    const routes = await sitemap()
    const urls = routes.map((r) => r.url)
    expect(urls).toContain(`${BASE}/terms`)
    expect(urls).toContain(`${BASE}/privacy`)
  })

  it('nunca incluye /checkout, /account o /handler', async () => {
    const routes = await sitemap()
    const urls = routes.map((r) => r.url)
    for (const blocked of ['/checkout', '/account', '/handler']) {
      expect(urls.some((u) => u.includes(blocked))).toBe(false)
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('sitemap — productos', () => {
  it('incluye solo productos activos con slug', async () => {
    mockGetProducts.mockResolvedValue([
      { id: 1, slug: 'cafe-blend', active: true,  name: 'Blend' } as any,
      { id: 2, slug: 'cafe-raw',   active: false, name: 'Raw'   } as any,
      { id: 3, slug: null,         active: true,  name: 'NoSlug'} as any,
    ])
    mockGetBlogPosts.mockResolvedValue([])

    const routes = await sitemap()
    const urls = routes.map((r) => r.url)

    expect(urls).toContain(`${BASE}/shop/cafe-blend`)
    expect(urls).not.toContain(`${BASE}/shop/cafe-raw`)
  })

  it('no falla si getProducts lanza error', async () => {
    mockGetProducts.mockRejectedValueOnce(new Error('DB down'))
    mockGetBlogPosts.mockResolvedValue([])

    const routes = await sitemap()
    // Should still return static routes
    expect(routes.length).toBeGreaterThan(0)
    expect(routes.find((r) => r.url === BASE)).toBeDefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('sitemap — blog', () => {
  it('incluye solo posts publicados con slug', async () => {
    mockGetProducts.mockResolvedValue([])
    mockGetBlogPosts.mockResolvedValue([
      { id: 1, slug: 'articulo-publicado',  published: true,  published_at: '2025-01-01' } as any,
      { id: 2, slug: 'articulo-borrador',   published: false, published_at: null          } as any,
    ])

    const routes = await sitemap()
    const urls = routes.map((r) => r.url)

    expect(urls).toContain(`${BASE}/blog/articulo-publicado`)
    expect(urls).not.toContain(`${BASE}/blog/articulo-borrador`)
  })

  it('usa published_at como lastModified cuando está disponible', async () => {
    mockGetProducts.mockResolvedValue([])
    mockGetBlogPosts.mockResolvedValue([
      { id: 1, slug: 'cafe-terroir', published: true, published_at: '2025-03-15T12:00:00Z' } as any,
    ])

    const routes = await sitemap()
    const blogRoute = routes.find((r) => r.url.includes('/blog/cafe-terroir'))
    expect(blogRoute?.lastModified).toEqual(new Date('2025-03-15T12:00:00Z'))
  })

  it('no falla si getBlogPosts lanza error', async () => {
    mockGetProducts.mockResolvedValue([])
    mockGetBlogPosts.mockRejectedValueOnce(new Error('DB down'))

    const routes = await sitemap()
    expect(routes.find((r) => r.url === BASE)).toBeDefined()
  })
})
