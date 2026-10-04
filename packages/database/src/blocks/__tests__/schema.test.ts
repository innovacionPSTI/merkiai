/**
 * Pruebas del contrato de bloques (HU-218 · paso 1).
 * Invariantes que mantienen coherentes render web, editor admin y validación.
 */
import {
  blockSchemas,
  TEMPLATE_HOME_LAYOUTS,
  templates,
  getBlockSchema,
  getTemplateHomeLayout,
  getTemplate,
  listTemplates,
  listBlockTypes,
  resolveBlockFields,
  getTemplateVariant,
  SURFACE_VARIANTS,
} from '../schema'

// section_type permitidos por el CHECK de page_sections (13 base + 4 genéricos HU-252).
const ALLOWED_TYPES = [
  'hero', 'text', 'cards', 'faq', 'cta', 'testimonials', 'whatsapp',
  'services', 'featured_products', 'best_sellers', 'historia',
  'blog_preview', 'newsletter',
  // HU-252 · bloques genéricos de layout
  'content_section', 'columns', 'media_banner', 'spacer',
]

describe('blockSchemas', () => {
  it('cubre exactamente los section_type permitidos por el CHECK', () => {
    expect(Object.keys(blockSchemas).sort()).toEqual([...ALLOWED_TYPES].sort())
  })

  it('cada schema declara type/label/description/category y su key coincide', () => {
    for (const [key, s] of Object.entries(blockSchemas)) {
      expect(s.type).toBe(key)
      expect(s.label).toBeTruthy()
      expect(s.description).toBeTruthy()
      expect(['content', 'commerce', 'engagement']).toContain(s.category)
    }
  })

  it('todo campo declara un storage válido', () => {
    for (const s of listBlockTypes()) {
      for (const f of Object.values(s.fields)) {
        expect(['column', 'settings', 'metadata']).toContain(f.storage)
      }
      for (const f of Object.values(s.items?.fields ?? {})) {
        expect(['column', 'settings', 'metadata']).toContain(f.storage)
      }
      for (const f of Object.values(s.source?.params ?? {})) {
        expect(f.storage).toBe('settings')
      }
    }
  })

  it('newsletter es feature de sistema (config fuera del bloque)', () => {
    expect(blockSchemas.newsletter.feature).toBe('newsletter')
  })
})

describe('layout presets', () => {
  it('todo tipo del preset default tiene schema', () => {
    for (const type of TEMPLATE_HOME_LAYOUTS.default) {
      expect(getBlockSchema(type)).toBeDefined()
    }
  })

  it('getTemplateHomeLayout cae a default para un template desconocido', () => {
    expect(getTemplateHomeLayout('inexistente')).toEqual(TEMPLATE_HOME_LAYOUTS.default)
  })
})

describe('resolveBlockFields', () => {
  it('lee campos de settings y aplica defaults del schema', () => {
    // historia: title/subtitle/cta_text/cta_url viven en settings, con defaults.
    const r = resolveBlockFields('historia', { settings: { title: 'Nuestra esencia' } })
    expect(r.title).toBe('Nuestra esencia')            // valor de settings
    expect(r.cta_text).toBe('Conoce nuestra historia →') // default del schema
  })

  it('lee campos de columna (storage column) con su key real', () => {
    // cta: cta_label vive en la columna cta_label de page_sections.
    const r = resolveBlockFields('cta', { cta_label: 'Comprar', title: 'Oferta' })
    expect(r.cta_label).toBe('Comprar')
    expect(r.title).toBe('Oferta')
  })

  it('vacío o nulo cae al default', () => {
    const r = resolveBlockFields('best_sellers', { settings: { title: '' } })
    expect(r.title).toBe('Tienda')
  })

  it('tipo desconocido devuelve objeto vacío', () => {
    expect(resolveBlockFields('inexistente', {})).toEqual({})
  })

  it('aplica blockDefaults del template cuando no hay valor de sección', () => {
    // 'esencial' define featured_products.title = 'Lo nuevo'.
    expect(resolveBlockFields('featured_products', null, 'esencial').title).toBe('Lo nuevo')
    // sin template, no hay override → default del schema (undefined aquí).
    expect(resolveBlockFields('featured_products', null).title).toBeUndefined()
  })

  it('un valor real de sección gana sobre el default del template', () => {
    const r = resolveBlockFields('featured_products', { title: 'Mi título' }, 'esencial')
    expect(r.title).toBe('Mi título')
  })
})

describe('templates', () => {
  it('todo tipo del layout de cada template tiene schema', () => {
    for (const t of listTemplates()) {
      for (const type of t.layout) expect(getBlockSchema(type)).toBeDefined()
    }
  })

  it('getTemplate cae a default para nombre desconocido', () => {
    expect(getTemplate('inexistente').name).toBe('default')
  })

  it('TEMPLATE_HOME_LAYOUTS se deriva de templates', () => {
    expect(TEMPLATE_HOME_LAYOUTS.esencial).toEqual(templates.esencial.layout)
    expect(getTemplateHomeLayout('esencial')).toEqual(templates.esencial.layout)
  })
})

describe('variantes de disposición por superficie (HU-122a)', () => {
  it('default cuando el template no declara variante', () => {
    expect(getTemplateVariant('default', 'product_grid')).toBe('comfortable')
  })

  it('usa la variante declarada por el template', () => {
    expect(getTemplateVariant('esencial', 'product_grid')).toBe('compact')
  })

  it('template desconocido → default de la superficie', () => {
    expect(getTemplateVariant('inexistente', 'product_grid')).toBe(SURFACE_VARIANTS.product_grid.default)
  })

  it('superficie desconocida → cadena vacía (sin crash)', () => {
    expect(getTemplateVariant('default', 'no_existe')).toBe('')
  })

  it('toda variante declarada existe en el catálogo', () => {
    for (const t of listTemplates()) {
      for (const [surface, value] of Object.entries(t.variants ?? {})) {
        expect(SURFACE_VARIANTS[surface]?.options.some((o) => o.value === value)).toBe(true)
      }
    }
  })
})

describe('bloques genéricos de layout (HU-252)', () => {
  it('registra los 4 bloques genéricos', () => {
    for (const t of ['content_section', 'columns', 'media_banner', 'spacer']) {
      expect(getBlockSchema(t)).toBeTruthy()
    }
  })

  it('content_section expone el select de disposición con opciones válidas', () => {
    const layout = blockSchemas.content_section.fields.layout
    expect(layout.type).toBe('select')
    expect(layout.options?.map((o) => o.value)).toEqual(['image-right', 'image-left', 'image-top', 'text-only'])
    expect(layout.default).toBe('image-right')
  })

  it('columns tiene ítems de tipo column y selects de columnas/alineación', () => {
    expect(blockSchemas.columns.items?.itemType).toBe('column')
    expect(blockSchemas.columns.fields.columns.options?.map((o) => o.value)).toEqual(['2', '3', '4'])
    expect(blockSchemas.columns.fields.align.options?.map((o) => o.value)).toEqual(['left', 'center'])
  })

  it('media_banner tiene altura y overlay; spacer tiene tamaño y divisor', () => {
    expect(blockSchemas.media_banner.fields.height.options?.map((o) => o.value)).toEqual(['small', 'medium', 'large', 'full'])
    expect(blockSchemas.media_banner.fields.overlay.type).toBe('boolean')
    expect(blockSchemas.spacer.fields.size.options?.map((o) => o.value)).toEqual(['small', 'medium', 'large'])
    expect(blockSchemas.spacer.fields.divider.type).toBe('boolean')
  })
})

describe('variantes de PDP y carrito (HU-122b/c)', () => {
  it('PDP: default gallery-left, esencial gallery-top', () => {
    expect(getTemplateVariant('default', 'product_detail')).toBe('gallery-left')
    expect(getTemplateVariant('esencial', 'product_detail')).toBe('gallery-top')
  })

  it('carrito: default comfortable, esencial compact', () => {
    expect(getTemplateVariant('default', 'cart')).toBe('comfortable')
    expect(getTemplateVariant('esencial', 'cart')).toBe('compact')
  })

  it('las superficies product_detail y cart están registradas', () => {
    expect(SURFACE_VARIANTS.product_detail.options.map((o) => o.value)).toEqual(['gallery-left', 'gallery-top'])
    expect(SURFACE_VARIANTS.cart.options.map((o) => o.value)).toEqual(['comfortable', 'compact'])
  })
})
