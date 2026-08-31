/**
 * Pruebas del contrato de bloques (HU-218 · paso 1).
 * Invariantes que mantienen coherentes render web, editor admin y validación.
 */
import {
  blockSchemas,
  TEMPLATE_HOME_LAYOUTS,
  getBlockSchema,
  getTemplateHomeLayout,
  listBlockTypes,
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
