import {
  itemStatus, coverageOf, translationsToCsv, csvToTranslationRows, groupCsvRows, listEntityTranslationItems,
  listBlockTranslationItems, saveBlockTranslation, type TranslationItem,
} from '../translation-workspace'

describe('HU-464 · completitud', () => {
  it('cuenta solo campos con texto original (el slug no cuenta)', () => {
    const fields = ['name', 'description', 'slug', 'seo_title']
    expect(itemStatus(fields, { name: 'Camiseta', description: 'Algodón', slug: 'camiseta', seo_title: '' }, { name: 'T-shirt', description: '', slug: '' }))
      .toEqual({ done: 1, total: 2, status: 'partial' })
    expect(itemStatus(fields, { name: 'Camiseta' }, {}).status).toBe('missing')
    expect(itemStatus(fields, { name: 'Camiseta' }, { name: 'T-shirt' }).status).toBe('complete')
  })

  it('AC-2 · resumen por idioma', () => {
    const c = coverageOf([
      { done: 2, total: 2, status: 'complete' }, { done: 1, total: 2, status: 'partial' }, { done: 0, total: 4, status: 'missing' },
    ])
    expect(c).toEqual({ items: 3, complete: 1, partial: 1, missing: 1, percent: 38 })
    expect(coverageOf([]).percent).toBe(100)
  })
})

describe('AC-3 · CSV', () => {
  const items: TranslationItem[] = [{
    type: 'product', id: '7', label: 'Camiseta', fields: ['name', 'description', 'slug'],
    base: { name: 'Camiseta', description: 'Algodón, suave', slug: 'camiseta' }, translation: { name: 'T-shirt', description: '', slug: '' },
    done: 1, total: 2, status: 'partial',
  }]

  it('exporta una fila por campo, escapando comas y fórmulas', () => {
    const csv = translationsToCsv([{ ...items[0], base: { ...items[0].base, name: '=HYPERLINK("x")' } }])
    const lines = csv.trim().split('\n')
    expect(lines[0]).toBe('tipo,id,campo,contexto,original,traduccion')
    expect(lines).toHaveLength(4)
    expect(lines[1]).toContain(`"'=HYPERLINK(""x"")"`)
    expect(lines[2]).toContain('"Algodón, suave"')
  })

  it('importa por nombre de columna, ignora filas inválidas y agrupa por elemento', () => {
    const csv = 'tipo,id,campo,contexto,original,traduccion\nproduct,7,name,x,Camiseta,T-shirt\nproduct,7,description,x,"Algodón, suave","Cotton, soft"\nfoo,1,name,x,a,b\n\n'
    const { rows, skipped } = csvToTranslationRows(csv)
    expect(skipped).toBe(1)
    expect(groupCsvRows(rows)).toEqual([{ type: 'product', id: '7', values: { name: 'T-shirt', description: 'Cotton, soft' } }])
    expect(() => csvToTranslationRows('a,b\n1,2')).toThrow(/columnas/)
  })

  it('ida y vuelta: lo exportado se puede reimportar', () => {
    const { rows } = csvToTranslationRows(translationsToCsv(items))
    expect(groupCsvRows(rows)[0].values).toEqual({ name: 'T-shirt', description: '', slug: '' })
  })
})

function fakeDb(tables: Record<string, Record<string, unknown>[]>) {
  const updates: Array<{ table: string; payload: Record<string, unknown> }> = []
  const from = (table: string) => {
    const filters: Array<(r: Record<string, unknown>) => boolean> = []
    let single = false
    let payload: Record<string, unknown> | null = null
    const b: Record<string, unknown> = {
      select: () => b, order: () => b,
      eq: (k: string, v: unknown) => { filters.push((r) => String(r[k]) === String(v)); return b },
      neq: (k: string, v: unknown) => { filters.push((r) => r[k] !== v); return b },
      in: (k: string, vs: unknown[]) => { filters.push((r) => vs.map(String).includes(String(r[k]))); return b },
      maybeSingle: () => { single = true; return b },
      update: (p: Record<string, unknown>) => { payload = p; return b },
      then: (res: (v: unknown) => unknown) => {
        const rows = (tables[table] ?? []).filter((r) => filters.every((f) => f(r)))
        if (payload) { updates.push({ table, payload }); rows.forEach((r) => Object.assign(r, payload)); return Promise.resolve({ error: null }).then(res) }
        return Promise.resolve({ data: single ? rows[0] ?? null : rows, error: null }).then(res)
      },
    }
    return b
  }
  return { db: { from } as never, updates, tables }
}

describe('lectura y guardado', () => {
  it('lista productos con su traducción del idioma', async () => {
    const { db } = fakeDb({
      products: [{ id: 7, name: 'Camiseta', description: 'Algodón', slug: 'camiseta', seo_title: null, seo_desc: null }],
      product_translations: [{ product_id: 7, locale: 'en-US', name: 'T-shirt' }, { product_id: 7, locale: 'es-MX', name: 'Playera' }],
    })
    const items = await listEntityTranslationItems(db, 'product', 'en-US')
    expect(items[0]).toMatchObject({ id: '7', label: 'Camiseta', translation: { name: 'T-shirt' }, status: 'partial' })
  })

  it('bloques: solo textos con original; guardar fusiona el idioma y quita vacíos', async () => {
    const { db, tables } = fakeDb({
      page_sections: [{ id: 1, page_key: 'home', section_type: 'cta', title: 'Compra', subtitle: '', cta_label: 'Ver', cta_url: '/shop', settings: {}, translations: { 'en-US': { title: 'Buy' } } }],
      section_items: [],
    })
    const items = await listBlockTranslationItems(db, 'en-US')
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ type: 'section', fields: ['title', 'cta_label'], translation: { title: 'Buy', cta_label: '' } })
    await saveBlockTranslation(db, 'section', 1, 'en-US', { cta_label: 'See', title: '' })
    expect(tables.page_sections[0].translations).toEqual({ 'en-US': { cta_label: 'See' } })
    await saveBlockTranslation(db, 'section', 1, 'en-US', { cta_label: '' })
    expect(tables.page_sections[0].translations).toEqual({})
  })
})
