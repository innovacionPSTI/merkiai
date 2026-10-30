// @jest-environment node
import {
  slugifyCollection, normalizeFields, validateItemData, deriveItemTitle,
  resolveCollectionList, recordTokens, substituteTokens, applyTokensDeep,
  COLLECTION_FIELD_TYPES, type CollectionField,
} from '../collections'
import type { Db } from '../../client'

describe('slugifyCollection (HU-353)', () => {
  it('normaliza acentos, espacios y mayúsculas', () => {
    expect(slugifyCollection('Café Especial 2024')).toBe('cafe-especial-2024')
    expect(slugifyCollection('  Hólá  ')).toBe('hola')
    expect(slugifyCollection('a/b_c')).toBe('a-b-c')
  })
})

describe('normalizeFields (HU-353)', () => {
  it('descarta entradas inválidas y claves duplicadas', () => {
    const fields = normalizeFields([
      { key: 'titulo', label: 'Título', type: 'text', required: true },
      { label: 'Resumen', type: 'textarea' },            // key derivada del label
      { key: 'titulo', label: 'Dup', type: 'text' },     // duplicado → descartado
      { key: 'x', type: 'tipo-invalido' },               // tipo inválido → descartado
      'basura',                                          // no-objeto → descartado
    ])
    expect(fields.map((f) => f.key)).toEqual(['titulo', 'resumen'])
    expect(fields[0].required).toBe(true)
  })

  it('conserva opciones de select y relationTo', () => {
    const [sel, rel] = normalizeFields([
      { key: 'estado', label: 'Estado', type: 'select', options: [{ value: 'a', label: 'A' }, { value: 'b' }] },
      { key: 'autor', label: 'Autor', type: 'relation', relationTo: 'personas' },
    ])
    expect(sel.options).toEqual([{ value: 'a', label: 'A' }, { value: 'b', label: 'b' }])
    expect(rel.relationTo).toBe('personas')
  })

  it('soporta todos los tipos declarados', () => {
    expect(COLLECTION_FIELD_TYPES).toContain('date')
    expect(COLLECTION_FIELD_TYPES).toContain('relation')
  })
})

describe('validateItemData (HU-353)', () => {
  const fields: CollectionField[] = [
    { key: 'titulo', label: 'Título', type: 'text', required: true },
    { key: 'precio', label: 'Precio', type: 'number' },
    { key: 'activo', label: 'Activo', type: 'boolean' },
    { key: 'fecha', label: 'Fecha', type: 'date' },
    { key: 'estado', label: 'Estado', type: 'select', options: [{ value: 'open', label: 'Abierto' }] },
  ]

  it('exige los campos required', () => {
    const r = validateItemData(fields, { precio: 10 })
    expect(r.ok).toBe(false)
    expect(r.errors[0]).toMatch(/Título/)
  })

  it('coacciona number/boolean y valida date/select', () => {
    const r = validateItemData(fields, { titulo: 'Hola', precio: '12.5', activo: 'true', fecha: '2026-01-15', estado: 'open' })
    expect(r.ok).toBe(true)
    expect(r.value).toEqual({ titulo: 'Hola', precio: 12.5, activo: true, fecha: '2026-01-15', estado: 'open' })
  })

  it('rechaza number no numérico, fecha inválida y select fuera de opciones', () => {
    expect(validateItemData(fields, { titulo: 'x', precio: 'abc' }).ok).toBe(false)
    expect(validateItemData(fields, { titulo: 'x', fecha: 'no-fecha' }).ok).toBe(false)
    expect(validateItemData(fields, { titulo: 'x', estado: 'cerrado' }).ok).toBe(false)
  })

  it('ignora claves desconocidas (solo saneado por esquema)', () => {
    const r = validateItemData(fields, { titulo: 'x', hacker: 'drop table' })
    expect(r.ok).toBe(true)
    expect(r.value).not.toHaveProperty('hacker')
  })
})

describe('deriveItemTitle (HU-353)', () => {
  const fields: CollectionField[] = [
    { key: 'nombre', label: 'Nombre', type: 'text' },
  ]
  it('usa data.title si existe, si no el primer texto con valor', () => {
    expect(deriveItemTitle(fields, { title: 'Explícito', nombre: 'x' })).toBe('Explícito')
    expect(deriveItemTitle(fields, { nombre: 'Derivado' })).toBe('Derivado')
    expect(deriveItemTitle(fields, {})).toBeNull()
  })
})

describe('tokens de plantilla (HU-354 AC-1)', () => {
  const item = { slug: 'mi-nota', title: 'Mi Nota', status: 'published', data: { titulo: 'Hola', autor: 'Ana', meta: { x: 1 } } }
  it('recordTokens incluye builtins y campos (objetos → JSON)', () => {
    const t = recordTokens(item)
    expect(t.slug).toBe('mi-nota'); expect(t.title).toBe('Mi Nota')
    expect(t.autor).toBe('Ana'); expect(t.meta).toBe('{"x":1}')
  })
  it('substituteTokens reemplaza {{campo}} y vacía los desconocidos', () => {
    const t = recordTokens(item)
    expect(substituteTokens('Por {{autor}} — {{title}}', t)).toBe('Por Ana — Mi Nota')
    expect(substituteTokens('{{ autor }} / {{nope}}', t)).toBe('Ana / ')
  })
  it('applyTokensDeep sustituye en strings anidados sin tocar otros tipos', () => {
    const t = recordTokens(item)
    const out = applyTokensDeep({ title: '{{title}}', n: 3, items: [{ body: 'de {{autor}}' }] }, t)
    expect(out).toEqual({ title: 'Mi Nota', n: 3, items: [{ body: 'de Ana' }] })
  })
})

describe('resolveCollectionList (HU-355)', () => {
  const collection = {
    key: 'noticias', label: 'Noticias', fields: [{ key: 'categoria', label: 'Cat', type: 'select' }],
  }
  const items = [
    { id: 1, slug: 'a', title: 'B noticia', status: 'published', order_index: 2, created_at: '2026-01-01', data: { categoria: 'local' } },
    { id: 2, slug: 'b', title: 'A noticia', status: 'published', order_index: 1, created_at: '2026-03-01', data: { categoria: 'global' } },
    { id: 3, slug: 'c', title: 'C noticia', status: 'published', order_index: 0, created_at: '2026-02-01', data: { categoria: 'local' } },
  ]
  function mockDb(): Db {
    const itemsChain = {
      select: () => itemsChain, eq: () => itemsChain, order: () => itemsChain,
      then: (resolve: (v: unknown) => void) => resolve({ data: items, error: null }),
    }
    const collChain = {
      select: () => collChain, eq: () => collChain,
      maybeSingle: () => Promise.resolve({ data: collection, error: null }),
    }
    return { from: (t: string) => (t === 'collections' ? collChain : itemsChain) } as unknown as Db
  }

  it('ordena por recientes (default) y respeta el límite', async () => {
    const { items: r } = await resolveCollectionList(mockDb(), { collectionKey: 'noticias', limit: 2 })
    expect(r.map((i) => i.slug)).toEqual(['b', 'c']) // 2026-03, 2026-02
  })

  it('ordena por título y por orden manual', async () => {
    const t = await resolveCollectionList(mockDb(), { collectionKey: 'noticias', orderBy: 'title', limit: 9 })
    expect(t.items.map((i) => i.title)).toEqual(['A noticia', 'B noticia', 'C noticia'])
    const m = await resolveCollectionList(mockDb(), { collectionKey: 'noticias', orderBy: 'manual', limit: 9 })
    expect(m.items.map((i) => i.slug)).toEqual(['c', 'b', 'a']) // order_index 0,1,2
  })

  it('filtra por campo/valor', async () => {
    const { items: r } = await resolveCollectionList(mockDb(), { collectionKey: 'noticias', filterField: 'categoria', filterValue: 'local', limit: 9 })
    expect(r.map((i) => i.slug).sort()).toEqual(['a', 'c'])
  })
})
