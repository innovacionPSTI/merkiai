// @jest-environment node
import { buildSavedBlockPayload } from '../saved-blocks'

describe('buildSavedBlockPayload (HU-358)', () => {
  it('captura las columnas del snapshot y los ítems, ignorando lo demás', () => {
    const section = {
      id: 7, page_key: 'home', tenant_id: 't', order_index: 3, enabled: true, // no viajan
      section_type: 'cards', title: 'Servicios', subtitle: null, body: null,
      image_url: null, cta_label: 'Ver', cta_url: '/x', settings: { style_bg: 'cream' },
    }
    const items = [
      { id: 1, section_id: 7, created_at: 'z', item_type: 'card', title: 'A', description: 'd', icon: '★', order_index: 0 },
    ]
    const p = buildSavedBlockPayload(section, items)
    expect(p.section_type).toBe('cards')
    expect(p.settings).toEqual({ style_bg: 'cream' })
    expect(p).not.toHaveProperty('id')
    expect(p).not.toHaveProperty('page_key')
    expect(p.items).toHaveLength(1)
    expect(p.items?.[0]).toEqual({ item_type: 'card', title: 'A', description: 'd', icon: '★', order_index: 0 })
  })

  it('sin ítems devuelve items vacío', () => {
    expect(buildSavedBlockPayload({ section_type: 'text', title: 'Hola' }).items).toEqual([])
  })
})
