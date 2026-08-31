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
} from '../schema'

// Los 13 section_type permitidos por el CHECK de page_sections.
const ALLOWED_TYPES = [
  'hero', 'text', 'cards', 'faq', 'cta', 'testimonials', 'whatsapp',
  'services', 'featured_products', 'best_sellers', 'historia',
  'blog_preview', 'newsletter',
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
