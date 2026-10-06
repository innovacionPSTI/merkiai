import { norm, matchesQuery, paginate, parseShopUrl, buildShopQuery } from '../shop-filters'

const prod = (over: any = {}): any => ({
  id: 1, name: 'Camiseta Azul', description: 'Algodón premium', slug: 'camiseta-azul',
  category: { id: 1, name: 'Ropa' }, variants: [{ sku: 'CAM-AZ-M' }], ...over,
})

describe('norm', () => {
  it('quita acentos/diacríticos y pasa a minúsculas (búsqueda tolerante)', () => {
    expect(norm('CAMISÉTA Ñandú')).toBe('camiseta nandu')
  })
})

describe('matchesQuery', () => {
  it('query vacío coincide siempre', () => {
    expect(matchesQuery(prod(), '')).toBe(true)
    expect(matchesQuery(prod(), '   ')).toBe(true)
  })
  it('coincide por nombre (insensible a acentos/mayúsculas)', () => {
    expect(matchesQuery(prod({ name: 'Café Especial' }), 'cafe')).toBe(true)
  })
  it('coincide por descripción, categoría y SKU', () => {
    expect(matchesQuery(prod(), 'algodon')).toBe(true)
    expect(matchesQuery(prod(), 'ropa')).toBe(true)
    expect(matchesQuery(prod(), 'cam-az')).toBe(true)
  })
  it('no coincide cuando no hay coincidencia', () => {
    expect(matchesQuery(prod(), 'zapato')).toBe(false)
  })
})

describe('paginate', () => {
  const list = Array.from({ length: 25 }, (_, i) => i + 1)
  it('divide en páginas del tamaño dado', () => {
    const p1 = paginate(list, 1, 10)
    expect(p1.items).toEqual([1,2,3,4,5,6,7,8,9,10])
    expect(p1.pageCount).toBe(3)
    expect(p1.safePage).toBe(1)
  })
  it('última página parcial', () => {
    expect(paginate(list, 3, 10).items).toEqual([21,22,23,24,25])
  })
  it('corrige página fuera de rango', () => {
    expect(paginate(list, 99, 10).safePage).toBe(3)
    expect(paginate(list, 0, 10).safePage).toBe(1)
  })
  it('lista vacía → 1 página', () => {
    expect(paginate([], 1, 10)).toMatchObject({ items: [], pageCount: 1, safePage: 1 })
  })
})

describe('parseShopUrl', () => {
  it('lee defaults cuando no hay params', () => {
    expect(parseShopUrl({})).toEqual({ q: '', categoria: null, orden: 'destacados', page: 1, attrs: {} })
  })
  it('lee q/categoria/orden/page/attrs', () => {
    expect(parseShopUrl({ q: 'cafe', categoria: '3', orden: 'precio-asc', page: '2', attr_Color: 'Rojo' }))
      .toEqual({ q: 'cafe', categoria: 3, orden: 'precio-asc', page: 2, attrs: { Color: 'Rojo' } })
  })
  it('ignora categoria no numérica y page<=1', () => {
    expect(parseShopUrl({ categoria: 'x', page: '1' })).toMatchObject({ categoria: null, page: 1 })
  })
})

describe('buildShopQuery', () => {
  it('omite los valores por defecto', () => {
    expect(buildShopQuery({ q: '', categoria: null, orden: 'destacados', page: 1, attrs: {} })).toBe('')
  })
  it('serializa solo lo no-default (atributos como attr_<nombre>)', () => {
    expect(buildShopQuery({ q: 'cafe', categoria: 3, orden: 'nombre', page: 2, attrs: { Color: 'Rojo' } }))
      .toBe('q=cafe&categoria=3&orden=nombre&page=2&attr_Color=Rojo')
  })
  it('round-trip con parseShopUrl', () => {
    const s = { q: 'té verde', categoria: 5, orden: 'precio-desc', page: 4, attrs: { Color: 'Azul', Talla: 'M' } }
    expect(parseShopUrl(Object.fromEntries(new URLSearchParams(buildShopQuery(s))))).toEqual(s)
  })
})
