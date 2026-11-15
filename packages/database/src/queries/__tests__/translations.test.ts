import {
  mergeTranslation, translationChain, localizeRows, findIdByTranslatedSlug, saveTranslation, slugifyTranslation, TRANSLATABLE,
} from '../translations'
import { localizeSection, isTranslatableField } from '../../blocks/localize'

const product = { id: 7, name: 'Camiseta', description: 'De algodón', slug: 'camiseta', seo_title: null, seo_desc: null, price: 50000 }
const fields = TRANSLATABLE.product.fields

describe('HU-463 · cadena de traducción', () => {
  it('locale → idioma base, sin el locale por defecto ni la referencia de plataforma para otro idioma', () => {
    expect(translationChain('es-MX', 'es-CO')).toEqual(['es-MX', 'es'])
    expect(translationChain('en-US', 'es-CO')).toEqual(['en-US', 'en'])
    expect(translationChain('es-CO', 'es-CO')).toEqual(['es'])
  })
})

describe('AC-1/AC-2 · fusión con fallback', () => {
  it('superpone los campos traducidos y conserva el resto', () => {
    const r = mergeTranslation(product, [{ locale: 'en', name: 'T-shirt', slug: 't-shirt', description: '' }], 'en-US', 'es-CO', fields)
    expect(r).toMatchObject({ name: 'T-shirt', slug: 't-shirt', description: 'De algodón', price: 50000, _translated: true, _locale: 'en-US', _baseSlug: 'camiseta' })
  })

  it('el regional gana al idioma base; un vacío no tapa', () => {
    const r = mergeTranslation(product, [
      { locale: 'es', name: 'Playera genérica', description: 'Algodón' },
      { locale: 'es-MX', name: 'Playera', description: '  ' },
    ], 'es-MX', 'es-CO', fields)
    expect(r.name).toBe('Playera')
    expect(r.description).toBe('Algodón')
  })

  it('AC-3 · sin traducción propia queda marcada como no traducida (no se anuncia)', () => {
    const r = mergeTranslation(product, [], 'en-US', 'es-CO', fields)
    expect(r).toMatchObject({ name: 'Camiseta', _translated: false, _locale: 'es-CO' })
    // Solo el slug traducido no cuenta como contenido traducido.
    expect(mergeTranslation(product, [{ locale: 'en', slug: 't-shirt' }], 'en-US', 'es-CO', fields)._translated).toBe(false)
  })
})

function fakeDb(rows: Record<string, unknown>[]) {
  const calls: string[] = []
  const store = rows.map((r) => ({ ...r }))
  const builder = (table: string) => {
    calls.push(table)
    const filters: Array<(r: Record<string, unknown>) => boolean> = []
    let op: 'select' | 'delete' | 'upsert' = 'select'
    let payload: Record<string, unknown> | null = null
    const b: Record<string, unknown> = {
      select: () => b,
      order: () => b,
      in: (k: string, vs: unknown[]) => { filters.push((r) => vs.includes(r[k])); return b },
      eq: (k: string, v: unknown) => { filters.push((r) => r[k] === v); return b },
      delete: () => { op = 'delete'; return b },
      upsert: (p: Record<string, unknown>) => { op = 'upsert'; payload = p; return b },
      then: (res: (v: unknown) => unknown) => {
        if (op === 'upsert') {
          const p = payload as Record<string, unknown>
          const fk = Object.keys(p).find((k) => k.endsWith('_id') || k === 'page_key') as string
          const i = store.findIndex((r) => r[fk] === p[fk] && r.locale === p.locale)
          if (i >= 0) store[i] = { ...store[i], ...p }; else store.push({ ...p })
          return Promise.resolve({ error: null }).then(res)
        }
        const hit = store.filter((r) => filters.every((f) => f(r)))
        if (op === 'delete') { for (const h of hit) store.splice(store.indexOf(h), 1); return Promise.resolve({ error: null }).then(res) }
        return Promise.resolve({ data: hit, error: null }).then(res)
      },
    }
    return b
  }
  return { db: { from: builder } as never, calls, store }
}

describe('capa de datos', () => {
  it('en el locale por defecto no consulta la BD (cero costo)', async () => {
    const { db, calls } = fakeDb([])
    const out = await localizeRows(db, 'product', [product], 'es-CO', 'es-CO')
    expect(calls).toEqual([])
    expect(out[0]).toMatchObject({ name: 'Camiseta', _translated: true })
  })

  it('localiza por lote con las traducciones de cada entidad', async () => {
    const { db } = fakeDb([
      { product_id: 7, locale: 'en', name: 'T-shirt' },
      { product_id: 8, locale: 'en', name: 'Cap' },
      { product_id: 7, locale: 'es', name: 'Remera' },
    ])
    const out = await localizeRows(db, 'product', [product, { ...product, id: 8, name: 'Gorra' }], 'en-US', 'es-CO')
    expect(out.map((p) => p.name)).toEqual(['T-shirt', 'Cap'])
  })

  it('AC-4 · resuelve el id desde el slug traducido', async () => {
    const { db } = fakeDb([{ product_id: 7, locale: 'en', slug: 't-shirt' }])
    expect(await findIdByTranslatedSlug(db, 'product', 't-shirt', 'en-US', 'es-CO')).toBe(7)
    expect(await findIdByTranslatedSlug(db, 'product', 't-shirt', 'es-MX', 'es-CO')).toBeNull()
  })

  it('guarda solo campos traducibles, normaliza el slug y borra si queda vacía', async () => {
    const { db, store } = fakeDb([])
    await saveTranslation(db, 't1', 'product', 7, 'en-us', { name: ' T-shirt ', slug: 'Camiseta Básica', price: 1 })
    expect(store[0]).toMatchObject({ tenant_id: 't1', product_id: 7, locale: 'en-US', name: 'T-shirt', slug: 'camiseta-basica' })
    expect(store[0].price).toBeUndefined()
    await saveTranslation(db, 't1', 'product', 7, 'en-US', { name: '', slug: '' })
    expect(store).toHaveLength(0)
    await expect(saveTranslation(db, 't1', 'product', 7, 'pt-BR', { name: 'x' })).rejects.toThrow(/no soportado/)
    expect(slugifyTranslation('Árbol Ñandú')).toBe('arbol-nandu')
  })
})

describe('AC-5 · bloques del Constructor', () => {
  const section = {
    id: 1, section_type: 'cta', title: 'Compra ya', subtitle: 'Envío gratis', cta_label: 'Ver tienda', cta_url: '/shop',
    settings: {}, translations: { en: { title: 'Buy now', cta_url: '/evil' }, 'en-US': { cta_label: 'Shop' } },
  }

  it('aplica textos traducibles por locale; URLs e imágenes no se traducen', () => {
    const r = localizeSection(section, 'en-US', 'es-CO')
    expect(r).toMatchObject({ title: 'Buy now', subtitle: 'Envío gratis', cta_label: 'Shop', cta_url: '/shop' })
  })

  it('en el locale por defecto devuelve la misma referencia; sin traducciones no cambia', () => {
    expect(localizeSection(section, 'es-CO', 'es-CO')).toBe(section)
    const plain = { ...section, translations: {} }
    expect(localizeSection(plain, 'en-US', 'es-CO')).toBe(plain)
  })

  it('traduce los ítems (columnas y metadata)', () => {
    const faq = {
      id: 2, section_type: 'faq', title: 'Preguntas', settings: {}, translations: { en: { title: 'Questions' } },
      items: [{ id: 1, question: '¿Envían?', answer: 'Sí', metadata: {}, translations: { en: { question: 'Do you ship?' } } }],
    }
    const r = localizeSection(faq, 'en-US', 'es-CO')
    expect(r.title).toBe('Questions')
    expect(r.items?.[0]).toMatchObject({ question: 'Do you ship?', answer: 'Sí' })
  })

  it('regla de campos traducibles', () => {
    expect(isTranslatableField({ label: 'x', type: 'text', storage: 'column' })).toBe(true)
    expect(isTranslatableField({ label: 'x', type: 'url', storage: 'column' })).toBe(false)
    expect(isTranslatableField({ label: 'x', type: 'text', storage: 'settings', translatable: false })).toBe(false)
  })
})
