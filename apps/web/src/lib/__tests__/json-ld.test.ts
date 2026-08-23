import { buildProductJsonLd, buildArticleJsonLd, lowestVariantPrice } from '../json-ld'

describe('lowestVariantPrice', () => {
  it('devuelve el precio más bajo', () => {
    expect(lowestVariantPrice([{ price: 30000 }, { price: 12000 }, { price: 45000 }])).toBe(12000)
  })
  it('devuelve null si no hay variantes', () => {
    expect(lowestVariantPrice([])).toBeNull()
    expect(lowestVariantPrice(null)).toBeNull()
  })
})

describe('buildProductJsonLd', () => {
  const base = {
    name: 'Café Especial',
    description: 'Notas de chocolate',
    images: [{ url: 'https://cdn/x.jpg' }],
    slug: 'cafe-especial',
    variants: [{ price: 30000 }, { price: 25000 }],
    storeName: 'Mi Tienda',
    siteUrl: 'https://shop.example.com/',
  }

  it('genera un Product schema válido con offers y brand', () => {
    const ld = buildProductJsonLd(base)
    expect(ld['@context']).toBe('https://schema.org')
    expect(ld['@type']).toBe('Product')
    expect(ld.name).toBe('Café Especial')
    expect(ld.image).toEqual(['https://cdn/x.jpg'])
    expect(ld.url).toBe('https://shop.example.com/shop/cafe-especial') // trailing slash normalizado
    expect(ld.offers).toEqual({
      '@type': 'Offer',
      priceCurrency: 'COP',
      price: 25000,
      availability: 'https://schema.org/InStock',
      url: 'https://shop.example.com/shop/cafe-especial',
    })
    expect(ld.brand).toEqual({ '@type': 'Brand', name: 'Mi Tienda' })
  })

  it('omite offers/brand/imagen cuando faltan datos', () => {
    const ld = buildProductJsonLd({ name: 'X', slug: 'x' })
    expect(ld.offers).toBeUndefined()
    expect(ld.brand).toBeUndefined()
    expect(ld.image).toBeUndefined()
    expect(ld.description).toBeUndefined()
    expect(ld['@type']).toBe('Product')
  })

  it('produce JSON serializable', () => {
    expect(() => JSON.stringify(buildProductJsonLd(base))).not.toThrow()
  })
})

describe('buildArticleJsonLd', () => {
  const base = {
    title: 'Cómo preparar café',
    excerpt: 'Guía rápida',
    cover_image: 'https://cdn/cover.jpg',
    published_at: '2026-01-10T00:00:00Z',
    created_at: '2026-01-01T00:00:00Z',
    slug: 'como-preparar-cafe',
    storeName: 'Mi Tienda',
    logoUrl: 'https://cdn/logo.png',
    siteUrl: 'https://shop.example.com',
  }

  it('genera un Article schema válido', () => {
    const ld = buildArticleJsonLd(base)
    expect(ld['@type']).toBe('Article')
    expect(ld.headline).toBe('Cómo preparar café')
    expect(ld.datePublished).toBe('2026-01-10T00:00:00Z') // usa published_at si existe
    expect(ld.url).toBe('https://shop.example.com/blog/como-preparar-cafe')
    expect((ld.publisher as Record<string, unknown>).logo).toEqual({ '@type': 'ImageObject', url: 'https://cdn/logo.png' })
  })

  it('cae a created_at y nombre por defecto cuando faltan', () => {
    const ld = buildArticleJsonLd({ title: 'T', created_at: '2026-02-02T00:00:00Z', slug: 't' })
    expect(ld.datePublished).toBe('2026-02-02T00:00:00Z')
    expect((ld.author as Record<string, unknown>).name).toBe('Commerce CMS')
    expect((ld.publisher as Record<string, unknown>).logo).toBeUndefined()
  })
})
