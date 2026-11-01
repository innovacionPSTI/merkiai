import { normalizeBlueprint, seedBlueprint, slugifyKey, type SiteBlueprint } from '../blueprint'

const T = '33333333-3333-3333-3333-333333333333'

describe('normalizeBlueprint (HU-373, pura)', () => {
  it('devuelve null si no hay nada aplicable', () => {
    expect(normalizeBlueprint(null)).toBeNull()
    expect(normalizeBlueprint({})).toBeNull()
    expect(normalizeBlueprint({ pages: [], nav: [], regions: { header: [], footer: [] } })).toBeNull()
  })

  it('slugifica keys, descarta sin key/label y deduplica (gana la primera)', () => {
    const bp: SiteBlueprint = {
      pages: [
        { key: 'Nosotros!', label: 'Acerca', slug: '', page_type: 'about' },
        { key: 'nosotros', label: 'Duplicada', slug: 'x' }, // dup por slugify → descartada
        { key: '', label: 'sin key' },                       // descartada
        { key: 'faq', label: '' },                           // descartada
      ],
    }
    const out = normalizeBlueprint(bp)!
    expect(out.pages).toHaveLength(1)
    expect(out.pages[0]).toMatchObject({ key: 'nosotros', label: 'Acerca', slug: 'nosotros', page_type: 'about' })
  })

  it('nunca crea/llamada para la página home (reservada)', () => {
    const out = normalizeBlueprint({ pages: [{ key: 'home', label: 'Inicio', slug: '' }, { key: 'blog', label: 'Blog', slug: 'blog' }] })!
    expect(out.pages.map((p) => p.key)).toEqual(['blog'])
  })

  it('recorta al tope de páginas del plan', () => {
    const pages = Array.from({ length: 5 }, (_, i) => ({ key: `p${i}`, label: `P${i}`, slug: `p${i}` }))
    const out = normalizeBlueprint({ pages }, { maxPages: 2 })!
    expect(out.pages).toHaveLength(2)
  })

  it('limpia nav: descarta sin label y slugifica page_key de hijos', () => {
    const out = normalizeBlueprint({
      pages: [{ key: 'blog', label: 'Blog', slug: 'blog' }],
      nav: [
        { label: '', href: '/x' },                                   // descartado
        { label: 'Tienda', page_key: 'Shop', children: [
          { label: 'Ofertas', page_key: 'Ofertas!' },
          { label: '', href: '/y' },                                 // hijo descartado
        ] },
      ],
    })!
    expect(out.nav).toHaveLength(1)
    expect(out.nav[0].page_key).toBe('shop')
    expect(out.nav[0].children).toEqual([{ label: 'Ofertas', href: null, page_key: 'ofertas' }])
  })
})

describe('slugifyKey', () => {
  it('normaliza acentos y símbolos', () => {
    expect(slugifyKey('Página Niños & Más')).toBe('pagina-ninos-mas')
  })
})

/** Mock de db con upsert/insert/select-count/single para probar seedBlueprint. */
function fakeDb(opts: { counts?: Record<string, number> } = {}) {
  const counts = opts.counts ?? {}
  const log = {
    upserts: [] as { table: string; row: Record<string, unknown> }[],
    inserts: [] as { table: string; rows: Record<string, unknown>[] }[],
  }
  let seq = 900
  function builder(table: string) {
    const state: { count?: boolean } = {}
    const chain: Record<string, unknown> = {
      select(_c: string, o?: { count?: string; head?: boolean }) { state.count = !!o?.head; return chain },
      eq() { return chain },
      single() { return Promise.resolve({ data: { id: ++seq }, error: null }) },
      upsert(row: Record<string, unknown>) { log.upserts.push({ table, row }); return Promise.resolve({ error: null }) },
      insert(rows: Record<string, unknown> | Record<string, unknown>[]) {
        const arr = Array.isArray(rows) ? rows : [rows]
        log.inserts.push({ table, rows: arr })
        return { select() { return { single: chain.single } }, then(r: (v: unknown) => void) { r({ error: null }) } }
      },
      then(resolve: (v: unknown) => void) {
        if (state.count) return resolve({ count: counts[table] ?? 0, error: null })
        resolve({ data: [], error: null })
      },
    }
    return chain
  }
  return { log, from: (t: string) => builder(t) }
}

const BP: SiteBlueprint = {
  pages: [
    { key: 'nosotros', label: 'Nosotros', slug: 'nosotros', page_type: 'about', sections: [{ section_type: 'text', title: 'Historia' }] },
    { key: 'faq', label: 'FAQ', slug: 'faq', sections: [{ section_type: 'faq', title: 'Preguntas', items: [{ title: 'Q', description: 'A' }] }] },
  ],
  nav: [{ label: 'Nosotros', page_key: 'nosotros' }, { label: 'Ayuda', children: [{ label: 'FAQ', page_key: 'faq' }] }],
  regions: {
    header: [{ section_type: 'text', title: 'Barra superior' }],
    footer: [{ section_type: 'cta', title: 'Suscríbete' }],
  },
}

describe('seedBlueprint (HU-373, BD, idempotente)', () => {
  it('crea páginas (upsert), sus secciones, nav y regiones', async () => {
    const db = fakeDb()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await seedBlueprint(db as any, T, BP)
    expect(res['page:nosotros']).toBe('ok')
    expect(res['page:faq']).toBe('ok')
    expect(res.nav).toBe('ok')
    expect(res.region_header).toBe('ok')
    expect(res.region_footer).toBe('ok')

    // Páginas creadas vía upsert con tenant + key + regiones reservadas.
    const pageKeys = db.log.upserts.filter((u) => u.table === 'pages').map((u) => u.row.key)
    expect(pageKeys).toEqual(expect.arrayContaining(['nosotros', 'faq', 'region_header', 'region_footer']))
    expect(db.log.upserts.find((u) => u.row.key === 'region_header')?.row).toMatchObject({ page_type: 'region', enabled: false })

    // Nav: 2 padres + 1 hijo.
    const navInserts = db.log.inserts.filter((i) => i.table === 'nav_items')
    const navRows = navInserts.flatMap((i) => i.rows)
    expect(navRows.filter((r) => !('parent_id' in r))).toHaveLength(2)
    expect(navRows.some((r) => 'parent_id' in r)).toBe(true)
  })

  it('no pisa el menú si el tenant ya tiene nav', async () => {
    const db = fakeDb({ counts: { nav_items: 3 } })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await seedBlueprint(db as any, T, BP)
    expect(res.nav).toMatch(/skipped/)
    expect(db.log.inserts.some((i) => i.table === 'nav_items')).toBe(false)
  })

  it('no siembra secciones de una página que ya las tiene', async () => {
    const db = fakeDb({ counts: { page_sections: 4 } })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await seedBlueprint(db as any, T, BP)
    expect(res['page:nosotros']).toMatch(/skipped/)
    expect(db.log.inserts.some((i) => i.table === 'page_sections')).toBe(false)
  })

  it('devuelve skipped si el blueprint es vacío', async () => {
    const db = fakeDb()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await seedBlueprint(db as any, T, {})
    expect(res.blueprint).toMatch(/vacío/)
  })
})
