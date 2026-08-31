import { splitItemFields, resolveItemFields, itemTypeOf, itemFields } from '../item-fields'

describe('item-fields', () => {
  it('itemTypeOf devuelve el item_type del bloque', () => {
    expect(itemTypeOf('hero')).toBe('slide')
    expect(itemTypeOf('services')).toBe('service')
    expect(itemTypeOf('cta')).toBeNull() // cta no tiene ítems
  })

  it('splitItemFields separa columnas y metadata según storage', () => {
    // slide: image_url/title/... = columna; bg_color = metadata
    const { columns, metadata } = splitItemFields('hero', {
      title: 'Bienvenido',
      image_url: 'https://x/img.webp',
      bg_color: '#614A2A',
    })
    expect(columns).toEqual({ title: 'Bienvenido', image_url: 'https://x/img.webp' })
    expect(metadata).toEqual({ bg_color: '#614A2A' })
  })

  it('splitItemFields preserva metadata previa', () => {
    const { metadata } = splitItemFields('testimonials', { rating: 4 }, { legacy: true })
    expect(metadata).toEqual({ legacy: true, rating: 4 })
  })

  it('resolveItemFields lee de columna y metadata con defaults', () => {
    const r = resolveItemFields('testimonials', { title: 'Ana', metadata: { rating: 5 } })
    expect(r.title).toBe('Ana')      // columna
    expect(r.rating).toBe(5)         // metadata
    expect(r.role).toBe('')          // ausente → default vacío
  })

  it('itemFields vacío para bloques sin ítems', () => {
    expect(itemFields('cta')).toEqual([])
  })
})
