// @jest-environment node
import {
  buildCollectionPackage, parseCollectionPackage, COLLECTION_PACKAGE_KIND, CollectionPackageError,
} from '../collection-package'

const collection = {
  key: 'noticias', label: 'Noticias', label_plural: 'Noticias', description: null, icon: null,
  enabled: true, order_index: 0, template_page_key: null,
  fields: [{ key: 'titulo', label: 'Título', type: 'text' as const, required: true }],
}

describe('buildCollectionPackage (HU-353 AC-5)', () => {
  it('serializa solo la definición cuando no se piden registros', () => {
    const pkg = buildCollectionPackage(collection)
    expect(pkg.kind).toBe(COLLECTION_PACKAGE_KIND)
    expect(pkg.definition.key).toBe('noticias')
    expect(pkg.records).toBeUndefined()
  })

  it('incluye registros de ejemplo cuando se pasan', () => {
    const pkg = buildCollectionPackage(collection, [
      { id: 1, tenant_id: 't', collection_key: 'noticias', slug: 'a', title: 'A', status: 'published', data: { titulo: 'A' }, order_index: 0, published_at: null, created_at: '', updated_at: '' },
    ])
    expect(pkg.records).toHaveLength(1)
    expect(pkg.records?.[0]).toEqual({ slug: 'a', status: 'published', data: { titulo: 'A' }, order_index: 0 })
  })
})

describe('parseCollectionPackage (HU-353 AC-5)', () => {
  it('ida y vuelta conserva la definición y normaliza campos', () => {
    const parsed = parseCollectionPackage(buildCollectionPackage(collection))
    expect(parsed.definition.key).toBe('noticias')
    expect(Array.isArray(parsed.definition.fields)).toBe(true)
    expect(parsed.records).toEqual([])
  })

  it('rechaza paquetes inválidos o de otro tipo', () => {
    expect(() => parseCollectionPackage(null)).toThrow(CollectionPackageError)
    expect(() => parseCollectionPackage({ kind: 'otro' })).toThrow(CollectionPackageError)
    expect(() => parseCollectionPackage({ kind: COLLECTION_PACKAGE_KIND, definition: {} })).toThrow(/key y label/)
  })

  it('tolera registros no-objeto (los descarta)', () => {
    const parsed = parseCollectionPackage({ kind: COLLECTION_PACKAGE_KIND, definition: { key: 'x', label: 'X' }, records: ['basura', { slug: 'ok' }] })
    expect(parsed.records).toEqual([{ slug: 'ok' }])
  })
})
