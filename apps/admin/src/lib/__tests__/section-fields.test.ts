import { splitSectionFields } from '../section-fields'

describe('splitSectionFields', () => {
  it('separa campos de columna y de settings según el schema', () => {
    // cta: title/subtitle/cta_label/cta_url/image_url son columnas.
    const { columns, settings } = splitSectionFields('cta', {
      title: 'Oferta',
      cta_label: 'Comprar',
      cta_url: '/shop',
    })
    expect(columns).toEqual({ title: 'Oferta', cta_label: 'Comprar', cta_url: '/shop' })
    expect(settings).toEqual({})
  })

  it('los campos settings van a settings, no a columnas', () => {
    // historia: title/subtitle/cta_text/cta_url viven en settings.
    const { columns, settings } = splitSectionFields('historia', {
      title: 'Nuestra esencia',
      cta_text: 'Ver más',
    })
    expect(columns).toEqual({})
    expect(settings).toEqual({ title: 'Nuestra esencia', cta_text: 'Ver más' })
  })

  it('preserva claves de settings ajenas al schema', () => {
    const { settings } = splitSectionFields(
      'historia',
      { title: 'Nueva' },
      { legacy_flag: true },
    )
    expect(settings).toEqual({ legacy_flag: true, title: 'Nueva' })
  })

  it('ignora campos que no están en el formulario', () => {
    const { columns, settings } = splitSectionFields('cta', { title: 'Solo título' })
    expect(columns).toEqual({ title: 'Solo título' })
    expect(settings).toEqual({})
  })

  it('tipo desconocido → payload vacío (fail-safe)', () => {
    expect(splitSectionFields('inexistente', { x: 1 })).toEqual({ columns: {}, settings: {} })
  })
})
