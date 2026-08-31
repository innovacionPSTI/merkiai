import { validateSectionPayload, validateItemByItemType } from '../section-validation'

describe('validateSectionPayload', () => {
  it('acepta campos de columna válidos (cta)', () => {
    const r = validateSectionPayload('cta', { title: 'Oferta', cta_url: '/shop' })
    expect(r.ok).toBe(true)
    expect(r.errors).toEqual([])
  })

  it('rechaza una URL inválida', () => {
    const r = validateSectionPayload('cta', { cta_url: 'no-es-url' })
    expect(r.ok).toBe(false)
    expect(r.errors[0]).toMatch(/URL válida|ruta/i)
  })

  it('acepta ruta relativa como URL', () => {
    expect(validateSectionPayload('cta', { cta_url: '/nosotros' }).ok).toBe(true)
    expect(validateSectionPayload('cta', { cta_url: 'https://x.com' }).ok).toBe(true)
  })

  it('valida campos en settings (whatsapp message_type = select)', () => {
    expect(validateSectionPayload('whatsapp', { settings: { message_type: 'ventas' } }).ok).toBe(true)
    const bad = validateSectionPayload('whatsapp', { settings: { message_type: 'inexistente' } })
    expect(bad.ok).toBe(false)
  })

  it('valida number (blog_preview.limit en settings)', () => {
    expect(validateSectionPayload('blog_preview', { settings: { limit: 3 } }).ok).toBe(true)
    // zod coerce: string numérica pasa; texto no numérico falla
    expect(validateSectionPayload('blog_preview', { settings: { limit: 'abc' } }).ok).toBe(false)
  })

  it('campos ausentes o vacíos son válidos (edición parcial)', () => {
    expect(validateSectionPayload('cta', {}).ok).toBe(true)
    expect(validateSectionPayload('cta', { cta_url: '' }).ok).toBe(true)
  })

  it('tipo desconocido → válido (el CHECK de la BD es backstop)', () => {
    expect(validateSectionPayload('inexistente', { x: 1 }).ok).toBe(true)
  })
})

describe('validateItemByItemType', () => {
  it('valida un slide (hero) por su item_type', () => {
    expect(validateItemByItemType('slide', { title: 'Hola', image_url: '/x.webp' }).ok).toBe(true)
    // link_url inválido (no absoluta ni ruta)
    expect(validateItemByItemType('slide', { link_url: 'ftp:no' }).ok).toBe(false)
  })

  it('valida rating (metadata, number) de un testimonio', () => {
    expect(validateItemByItemType('testimonial', { metadata: { rating: 5 } }).ok).toBe(true)
    expect(validateItemByItemType('testimonial', { metadata: { rating: 'x' } }).ok).toBe(false)
  })

  it('item_type desconocido → válido', () => {
    expect(validateItemByItemType('inexistente', { a: 1 }).ok).toBe(true)
  })
})
