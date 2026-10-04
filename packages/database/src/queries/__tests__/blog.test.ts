/**
 * Unit tests for blog query helpers. `db` es obligatorio (tenant-scoped): se
 * inyecta el supabase simulado directamente (sin default a service-role).
 */

import { getBlogPosts, getBlogPostBySlug, getBlogPostBySlugAny } from '../blog'
import type { Db } from '../../client'

const mockPost = {
  id: 1,
  slug: 'guia-catacion-cafe',
  title: 'Guía de catación de café',
  category: 'Cultura',
  published: true,
  published_at: '2026-06-01T00:00:00Z',
  excerpt: 'Aprende a catar café como un profesional.',
  content: '<p>Contenido completo...</p>',
  cover_image: '/blog/catacion.jpg',
}

const asDb = (o: unknown) => o as unknown as Db

beforeEach(() => jest.clearAllMocks())

// ─────────────────────────────────────────────
// getBlogPosts
// ─────────────────────────────────────────────
describe('getBlogPosts', () => {
  it('retorna posts publicados ordenados por fecha descendente', async () => {
    const posts = [
      { ...mockPost, id: 2, slug: 'post-nuevo', published_at: '2026-07-01T00:00:00Z' },
      { ...mockPost, id: 1, slug: 'guia-catacion-cafe', published_at: '2026-06-01T00:00:00Z' },
    ]
    const orderMock = jest.fn().mockResolvedValue({ data: posts, error: null })
    const db = { from: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ order: orderMock }) }) }) }

    const result = await getBlogPosts(undefined, asDb(db))
    expect(result).toHaveLength(2)
    expect(orderMock).toHaveBeenCalledWith('published_at', { ascending: false })
  })

  it('filtra por categoría cuando se proporciona', async () => {
    const categoryEqMock = jest.fn().mockResolvedValue({ data: [mockPost], error: null })
    const limitMock = jest.fn().mockReturnValue({ then: undefined })
    const orderMock = jest.fn().mockReturnValue({ eq: categoryEqMock, limit: limitMock })
    const publishedEqMock = jest.fn().mockReturnValue({ order: orderMock })
    const db = { from: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ eq: publishedEqMock }) }) }

    await getBlogPosts({ category: 'Cultura' }, asDb(db))
    expect(categoryEqMock).toHaveBeenCalledWith('category', 'Cultura')
  })

  it('aplica limit cuando se proporciona', async () => {
    const limitMock = jest.fn().mockResolvedValue({ data: [mockPost], error: null })
    const orderMock = jest.fn().mockReturnValue({ limit: limitMock })
    const publishedEqMock = jest.fn().mockReturnValue({ order: orderMock })
    const db = { from: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ eq: publishedEqMock }) }) }

    await getBlogPosts({ limit: 5 }, asDb(db))
    expect(limitMock).toHaveBeenCalledWith(5)
  })

  it('lanza error si Supabase falla', async () => {
    const orderMock = jest.fn().mockResolvedValue({ data: null, error: new Error('DB error') })
    const db = { from: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ order: orderMock }) }) }) }

    await expect(getBlogPosts(undefined, asDb(db))).rejects.toThrow('DB error')
  })
})

// ─────────────────────────────────────────────
// getBlogPostBySlug
// ─────────────────────────────────────────────
describe('getBlogPostBySlug', () => {
  it('retorna el post con el slug indicado', async () => {
    const singleMock = jest.fn().mockResolvedValue({ data: mockPost, error: null })
    const db = { from: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ single: singleMock }) }) }) }) }

    const post = await getBlogPostBySlug('guia-catacion-cafe', asDb(db))
    expect(post.slug).toBe('guia-catacion-cafe')
  })

  it('lanza error si el post no existe', async () => {
    const singleMock = jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'Row not found' } })
    const db = { from: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ single: singleMock }) }) }) }) }

    await expect(getBlogPostBySlug('no-existe', asDb(db))).rejects.toMatchObject({ code: 'PGRST116' })
  })
})

// ─────────────────────────────────────────────
// getBlogPostBySlugAny (draft)
// ─────────────────────────────────────────────
describe('getBlogPostBySlugAny', () => {
  it('retorna el post sin filtrar por published (para borrador)', async () => {
    const singleMock = jest.fn().mockResolvedValue({ data: { ...mockPost, published: false }, error: null })
    const db = { from: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ single: singleMock }) }) }) }

    const post = await getBlogPostBySlugAny('guia-catacion-cafe', asDb(db))
    expect(post.slug).toBe('guia-catacion-cafe')
    expect(post.published).toBe(false)
  })
})
