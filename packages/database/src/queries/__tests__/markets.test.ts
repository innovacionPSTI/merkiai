import {
  validateMarkets, applyMarketChange, normalizeMarketInput, enabledLocales, storeDefaultLocale,
  marketKeyFromName, listMarkets, saveMarket, deleteMarket, DEFAULT_MARKET, MarketValidationError, type Market,
} from '../markets'

const co: Market = { ...DEFAULT_MARKET, id: 1, virtual: undefined }
const rules = { maxLanguages: 1 as number | null, marketsEnabled: false, baseCurrency: 'COP' }

describe('HU-461 · reglas puras de mercados', () => {
  it('AC-1 · el mercado por defecto reproduce el comportamiento actual (es-CO, COP)', () => {
    expect(DEFAULT_MARKET).toMatchObject({ locales: ['es-CO'], default_locale: 'es-CO', currency: 'COP', is_default: true })
    expect(storeDefaultLocale([])).toBe('es-CO')
    expect(validateMarkets([co], rules)).toEqual([])
  })

  it('normaliza la entrada (locales canónicos, mayúsculas, dominio limpio, clave desde el nombre)', () => {
    const n = normalizeMarketInput({ name: 'Estados Unidos', locales: ['en-us', 'en-US'], default_locale: 'EN-us', countries: ['us'], currency: 'cop', domain: 'https://Tienda.com/x' })
    expect(n).toMatchObject({ key: 'estados-unidos', locales: ['en-US'], default_locale: 'en-US', countries: ['US'], currency: 'COP', domain: 'tienda.com' })
    expect(marketKeyFromName('México')).toBe('mexico')
  })

  it('AC-2/AC-3 · con 1 idioma en el plan, habilitar un segundo locale se rechaza con aviso de plan', () => {
    const next = applyMarketChange([co], { id: 1, name: 'Colombia', key: 'colombia', locales: ['es-CO', 'en-US'], default_locale: 'es-CO', currency: 'COP', countries: ['CO'], is_default: true })
    expect(validateMarkets(next, rules).join(' ')).toMatch(/un solo idioma/)
    expect(validateMarkets(next, { ...rules, maxLanguages: 2 })).toEqual([])
    expect(validateMarkets(next, { ...rules, maxLanguages: null })).toEqual([])
  })

  it('el límite cuenta locales distintos entre todos los mercados activos', () => {
    const mx: Market = { ...co, id: 2, key: 'mexico', name: 'México', countries: ['MX'], locales: ['es-MX', 'en-US'], default_locale: 'es-MX', is_default: false }
    const both = [{ ...co, locales: ['es-CO', 'en-US'] as Market['locales'] }, mx]
    expect(enabledLocales(both)).toEqual(['es-CO', 'en-US', 'es-MX'])
    expect(validateMarkets(both, { ...rules, marketsEnabled: true, maxLanguages: 2 }).join(' ')).toMatch(/permite 2 idiomas/)
    expect(validateMarkets(both, { ...rules, marketsEnabled: true, maxLanguages: 3 })).toEqual([])
    expect(enabledLocales([co, { ...mx, active: false }])).toEqual(['es-CO'])
  })

  it('sin la feature `markets` solo se permite un mercado', () => {
    const next = applyMarketChange([co], { name: 'México', locales: ['es-CO'], default_locale: 'es-CO', currency: 'COP' })
    expect(validateMarkets(next, rules).join(' ')).toMatch(/un solo mercado/)
    expect(validateMarkets(next, { ...rules, marketsEnabled: true })).toEqual([])
  })

  it('AC-4 · sin multimoneda, un mercado nuevo debe usar la moneda base', () => {
    const next = applyMarketChange([co], { name: 'México', locales: ['es-CO'], default_locale: 'es-CO', currency: 'MXN' })
    expect(validateMarkets(next, { ...rules, marketsEnabled: true }).join(' ')).toMatch(/moneda de la tienda \(COP\)/)
    // HU-467 · con multimoneda hace falta la tasa (o una lista de precios) en la otra moneda.
    expect(validateMarkets(next, { ...rules, marketsEnabled: true, multiCurrency: true }).join(' ')).toMatch(/tasa de cambio/)
    const withRate = applyMarketChange([co], { name: 'México', locales: ['es-CO'], default_locale: 'es-CO', currency: 'MXN', fx_rate: 0.0042 })
    expect(validateMarkets(withRate, { ...rules, marketsEnabled: true, multiCurrency: true })).toEqual([])
  })

  it('AC-5 · un solo default, activo, y su locale por defecto debe estar habilitado', () => {
    const switched = applyMarketChange([co], { name: 'México', key: 'mexico', locales: ['es-CO'], default_locale: 'es-CO', currency: 'COP', is_default: true })
    expect(switched.filter((m) => m.is_default)).toHaveLength(1)
    expect(switched.find((m) => m.is_default)?.key).toBe('mexico')
    expect(validateMarkets([{ ...co, is_default: false }], rules).join(' ')).toMatch(/exactamente un mercado por defecto/)
    expect(validateMarkets([{ ...co, active: false }], rules).join(' ')).toMatch(/no puede estar inactivo/)
    expect(validateMarkets([{ ...co, default_locale: 'en-US' }], { ...rules, maxLanguages: null }).join(' ')).toMatch(/idioma por defecto debe estar entre los habilitados/)
  })

  it('rechaza locales no soportados, claves y dominios repetidos, países inválidos', () => {
    const errs = validateMarkets([
      { ...co, locales: ['pt-BR' as never], default_locale: 'pt-BR' as never, domain: 'tienda.co' },
      { ...co, id: 2, is_default: false, countries: ['COL'], domain: 'tienda.co' },
    ], { ...rules, marketsEnabled: true, maxLanguages: null }).join(' ')
    expect(errs).toMatch(/no soportado/)
    expect(errs).toMatch(/clave "colombia"/)
    expect(errs).toMatch(/ya está asignado/)
    expect(errs).toMatch(/código de país inválido/)
  })
})

// ── Capa de datos con un doble de Supabase en memoria ─────────────────────────
function fakeDb(initial: Record<string, unknown>[] = []) {
  const rows = initial.map((r) => ({ ...r }))
  let seq = 100
  const builder = () => {
    const filters: [string, string, unknown][] = []
    let op: 'select' | 'insert' | 'update' | 'delete' = 'select'
    let payload: Record<string, unknown> | null = null
    let single = false
    const match = (r: Record<string, unknown>) => filters.every(([k, kind, v]) => (kind === 'eq' ? r[k] === v : r[k] !== v))
    const exec = () => {
      if (op === 'insert') {
        const row: Record<string, unknown> = { id: ++seq, ...payload }
        if (row.is_default && rows.some((r) => r.tenant_id === row.tenant_id && r.is_default)) return { data: null, error: { message: 'duplicate default' } }
        rows.push(row); return { data: single ? row : [row], error: null }
      }
      const hit = rows.filter(match)
      if (op === 'update') { hit.forEach((r) => Object.assign(r, payload)); return { data: single ? hit[0] ?? null : hit, error: null } }
      if (op === 'delete') { for (const r of hit) rows.splice(rows.indexOf(r), 1); return { data: null, error: null } }
      return { data: single ? hit[0] ?? null : hit, error: null }
    }
    const b: Record<string, unknown> = {
      select: () => b, order: () => b,
      insert: (p: Record<string, unknown>) => { op = 'insert'; payload = p; return b },
      update: (p: Record<string, unknown>) => { op = 'update'; payload = p; return b },
      delete: () => { op = 'delete'; return b },
      eq: (k: string, v: unknown) => { filters.push([k, 'eq', v]); return b },
      neq: (k: string, v: unknown) => { filters.push([k, 'neq', v]); return b },
      single: () => { single = true; return b },
      then: (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) => Promise.resolve(exec()).then(res, rej),
    }
    return b
  }
  return { db: { from: () => builder() } as never, rows }
}

describe('HU-461 · capa de datos', () => {
  const T = 'tenant-1'
  const open = { maxLanguages: null, marketsEnabled: true }

  it('sin filas devuelve el mercado virtual por defecto', async () => {
    const { db } = fakeDb()
    const ms = await listMarkets(db, T)
    expect(ms).toHaveLength(1)
    expect(ms[0]).toMatchObject({ key: 'colombia', virtual: true })
  })

  it('editar el mercado virtual lo guarda como fila por defecto', async () => {
    const { db, rows } = fakeDb()
    await saveMarket(db, T, { id: 0, name: 'Colombia', locales: ['es-CO', 'en-US'], default_locale: 'es-CO', currency: 'COP', countries: ['CO'], is_default: true }, { maxLanguages: 2, marketsEnabled: false })
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ tenant_id: T, is_default: true, locales: ['es-CO', 'en-US'] })
  })

  it('crear un mercado nuevo materializa antes el por defecto; cambiar el default libera el anterior', async () => {
    const { db, rows } = fakeDb()
    const mx = await saveMarket(db, T, { name: 'México', locales: ['es-MX'], default_locale: 'es-MX', currency: 'COP', countries: ['MX'] }, open)
    expect(rows.map((r) => r.key).sort()).toEqual(['colombia', 'mexico'])
    await saveMarket(db, T, { id: mx.id, name: 'México', key: 'mexico', locales: ['es-MX'], default_locale: 'es-MX', currency: 'COP', countries: ['MX'], is_default: true }, open)
    expect(rows.filter((r) => r.is_default).map((r) => r.key)).toEqual(['mexico'])
  })

  it('rechaza con MarketValidationError (AC-3) y no escribe nada', async () => {
    const { db, rows } = fakeDb()
    await expect(saveMarket(db, T, { name: 'USA', locales: ['en-US'], default_locale: 'en-US', currency: 'COP' }, { maxLanguages: 1, marketsEnabled: true })).rejects.toBeInstanceOf(MarketValidationError)
    expect(rows).toHaveLength(0)
  })

  it('no permite eliminar el mercado por defecto', async () => {
    const { db } = fakeDb([{ id: 1, tenant_id: T, key: 'colombia', name: 'Colombia', countries: ['CO'], currency: 'COP', locales: ['es-CO'], default_locale: 'es-CO', is_default: true, active: true }])
    await expect(deleteMarket(db, T, 1)).rejects.toThrow(/por defecto/)
  })
})

describe('HU-468 · países de venta', () => {
  it('une países soportados de mercados activos, el default primero; CO si no hay', async () => {
    const { marketCountries } = await import('../markets')
    const mx: Market = { ...co, id: 2, key: 'mx', countries: ['MX', 'BR'], is_default: false }
    const us: Market = { ...co, id: 3, key: 'us', countries: ['US'], is_default: false, active: false }
    expect(marketCountries([mx, co, us])).toEqual(['CO', 'MX'])
    expect(marketCountries([{ ...co, countries: [] }])).toEqual(['CO'])
  })
})

describe('HU-468 · AC-3 · documento de la contraparte', () => {
  it('rechaza un NIT con dígito de verificación inválido y normaliza el válido', async () => {
    const { createParty } = await import('../receivables')
    const inserted: Record<string, unknown>[] = []
    const db = {
      from: () => ({
        insert: (row: Record<string, unknown>) => {
          inserted.push(row)
          return { select: () => ({ single: async () => ({ data: { id: 'p1', ...row }, error: null }) }) }
        },
      }),
    } as never
    await expect(createParty(db, 't', { name: 'Aliado', document_type: 'NIT', document_id: '900123456-1' })).rejects.toThrow(/NIT no es válido/)
    expect(inserted).toHaveLength(0)
    await createParty(db, 't', { name: 'Aliado', document_type: 'nit', document_id: '900.123.456-8' })
    expect(inserted[0]).toMatchObject({ document_id: '900123456-8', document_type: 'NIT' })
  })
})
