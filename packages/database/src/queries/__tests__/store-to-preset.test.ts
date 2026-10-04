import { buildStorePresetPayload, PRESET_THEME_FIELDS } from '../store-to-preset'

const theme = {
  id: 1, tenant_id: 't', is_active: true, is_default: false, name: 'Mi tema',
  color_primary: '#111', color_dark: '#000', color_cream: '#fff', color_cream_warm: '#fef',
  color_yellow: '#ff0', color_yellow_pale: '#ffe', color_text: '#222', color_price: '#a00',
  font_display: 'lora', font_body: 'inter', color_scheme: 'auto',
  dark_bg: '#101010', dark_surface: '#202020', dark_text: '#eee', template: 'esencial',
  created_at: 'x', updated_at: 'y',
} as any

const sections = [
  { id: 2, tenant_id: 't', section_key: 'k2', page_key: 'home', section_type: 'columns',
    title: 'Cols', subtitle: null, body: null, image_url: null, cta_label: null, cta_url: null,
    enabled: true, order_index: 10, settings: { columns: '3' }, draft: null, created_at: 'x', updated_at: 'y',
    items: [{ id: 9, tenant_id: 't', section_id: 2, item_type: 'column', icon: '★', title: 'A',
      description: 'd', question: null, answer: null, image_url: null, image_url_mobile: null,
      link_url: '/a', cta_text: 'ir', metadata: { k: 1 }, enabled: true, order_index: 0, draft: null, created_at: 'x', updated_at: 'y' }] },
  { id: 1, tenant_id: 't', section_key: 'k1', page_key: 'home', section_type: 'content_section',
    title: 'Hola', subtitle: null, body: 'Texto', image_url: 'https://img', cta_label: 'Ver', cta_url: '/x',
    enabled: true, order_index: 0, settings: { layout: 'image-top', style_bg: 'cream' }, draft: null, created_at: 'x', updated_at: 'y', items: [] },
] as any

describe('buildStorePresetPayload (HU-256)', () => {
  it('toma solo los campos del Tema para el preset (sin id/tenant/flags)', () => {
    const p = buildStorePresetPayload({ theme, homeSections: [] })
    expect(Object.keys(p.theme ?? {}).sort()).toEqual([...PRESET_THEME_FIELDS].sort())
    expect((p.theme as any).id).toBeUndefined()
    expect((p.theme as any).is_active).toBeUndefined()
    expect(p.template).toBe('esencial')
  })

  it('ordena las secciones por order_index y mapea columnas + ítems', () => {
    const p = buildStorePresetPayload({ theme, homeSections: sections, inventoryModel: 'multi_location' })
    expect(p.home_sections?.map((s) => s.section_type)).toEqual(['content_section', 'columns'])
    const content = p.home_sections![0]
    expect(content.image_url).toBe('https://img')
    expect(content.cta_label).toBe('Ver')
    expect(content.settings).toEqual({ layout: 'image-top', style_bg: 'cream' })
    const cols = p.home_sections![1]
    expect(cols.items?.[0]).toMatchObject({ item_type: 'column', title: 'A', cta_text: 'ir', metadata: { k: 1 } })
    expect(p.inventory_model).toBe('multi_location')
  })

  it('catálogo de ejemplo vacío por defecto', () => {
    const p = buildStorePresetPayload({ theme, homeSections: sections })
    expect(p.sample_categories).toEqual([])
    expect(p.sample_products).toEqual([])
  })

  it('sin tema → theme vacío y template default', () => {
    const p = buildStorePresetPayload({ theme: null, homeSections: [] })
    expect(p.theme).toEqual({})
    expect(p.template).toBe('default')
  })
})
