import {
  buildPagePackage,
  parsePagePackage,
  PagePackageError,
  PAGE_PACKAGE_KIND,
  PAGE_PACKAGE_VERSION,
} from '../page-package'

const page = {
  key: 'promo', slug: 'promo', label: 'Promo', page_type: 'landing',
  show_in_footer: false, meta_title: 'T', meta_description: 'D',
  enabled: true, order_index: 2, created_at: 'x', updated_at: 'y',
} as any

const sections = [
  {
    id: 1, tenant_id: 't', section_key: 'uuid-1', page_key: 'promo',
    section_type: 'content_section', title: 'Hola', subtitle: null, body: 'Texto',
    image_url: null, cta_label: 'Ver', cta_url: '/x', enabled: true, order_index: 0,
    settings: { layout: 'image-top', style_bg: 'cream' }, draft: null, created_at: 'x', updated_at: 'y',
    items: [],
  },
  {
    id: 2, tenant_id: 't', section_key: 'uuid-2', page_key: 'promo',
    section_type: 'columns', title: 'Cols', subtitle: null, body: null,
    image_url: null, cta_label: null, cta_url: null, enabled: false, order_index: 1,
    settings: { columns: '3' }, draft: null, created_at: 'x', updated_at: 'y',
    items: [
      { id: 10, tenant_id: 't', section_id: 2, item_type: 'column', icon: '★', title: 'A',
        description: 'd', question: null, answer: null, image_url: null, image_url_mobile: null,
        link_url: '/a', cta_text: 'ir', metadata: { k: 1 }, enabled: true, order_index: 0,
        draft: null, created_at: 'x', updated_at: 'y' },
    ],
  },
] as any

describe('buildPagePackage (HU-255)', () => {
  it('serializa página + secciones + ítems sin ids/tenant/claves internas', () => {
    const pkg = buildPagePackage(page, sections)
    expect(pkg.kind).toBe(PAGE_PACKAGE_KIND)
    expect(pkg.schema_version).toBe(PAGE_PACKAGE_VERSION)
    expect(pkg.page).toEqual({ label: 'Promo', page_type: 'landing', show_in_footer: false, meta_title: 'T', meta_description: 'D' })
    expect((pkg.page as any).key).toBeUndefined()
    expect(pkg.sections).toHaveLength(2)
    const s0 = pkg.sections[0] as any
    expect(s0.section_type).toBe('content_section')
    expect(s0.settings).toEqual({ layout: 'image-top', style_bg: 'cream' })
    expect(s0.tenant_id).toBeUndefined()
    expect(s0.section_key).toBeUndefined()
    expect(s0.id).toBeUndefined()
    const item = (pkg.sections[1] as any).items[0]
    expect(item.item_type).toBe('column')
    expect(item.metadata).toEqual({ k: 1 })
    expect(item.id).toBeUndefined()
    expect(item.section_id).toBeUndefined()
  })
})

describe('parsePagePackage (HU-255)', () => {
  it('redondea build→parse', () => {
    const parsed = parsePagePackage(buildPagePackage(page, sections))
    expect(parsed.page.page_type).toBe('landing')
    expect(parsed.sections).toHaveLength(2)
    expect(parsed.sections[1].items).toHaveLength(1)
  })

  it('rechaza objetos que no son páginas Merkiai', () => {
    expect(() => parsePagePackage({ kind: 'x', schema_version: 1 })).toThrow(PagePackageError)
  })

  it('rechaza versiones más nuevas', () => {
    expect(() => parsePagePackage({ kind: PAGE_PACKAGE_KIND, schema_version: 99, page: {}, sections: [] }))
      .toThrow(/más nueva/i)
  })

  it('descarta secciones sin section_type e ignora claves desconocidas', () => {
    const parsed = parsePagePackage({
      kind: PAGE_PACKAGE_KIND, schema_version: 1, page: { label: 'P', hack: 1 },
      sections: [{ section_type: 'text', title: 'ok', hack: 2, items: [] }, { title: 'sin tipo' }],
    })
    expect((parsed.page as any).hack).toBeUndefined()
    expect(parsed.sections).toHaveLength(1)
    expect((parsed.sections[0] as any).hack).toBeUndefined()
  })

  it('tolera sections ausente → array vacío', () => {
    expect(parsePagePackage({ kind: PAGE_PACKAGE_KIND, schema_version: 1, page: {} }).sections).toEqual([])
  })
})
