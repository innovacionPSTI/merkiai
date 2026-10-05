import { parseCategoriesCsv, CATEGORY_IMPORT_TEMPLATE } from '../category-import'

describe('parseCategoriesCsv', () => {
  it('parsea categorías con jerarquía por parent_slug', () => {
    const csv = [
      'slug,name,description,parent_slug,active,order_index',
      'ropa,Ropa,Prendas,,true,0',
      'camisetas,Camisetas,,ropa,true,1',
    ].join('\n')
    const { categories, errors } = parseCategoriesCsv(csv)
    expect(errors).toHaveLength(0)
    expect(categories).toHaveLength(2)
    expect(categories[0]).toMatchObject({ slug: 'ropa', name: 'Ropa', parent_slug: null, order_index: 0 })
    expect(categories[1]).toMatchObject({ slug: 'camisetas', parent_slug: 'ropa', order_index: 1 })
  })

  it('acepta sinónimos en español', () => {
    const csv = ['slug,nombre,madre', 'c,Camisetas,ropa'].join('\n')
    const { categories, errors } = parseCategoriesCsv(csv)
    expect(errors).toHaveLength(0)
    expect(categories[0]).toMatchObject({ slug: 'c', name: 'Camisetas', parent_slug: 'ropa' })
  })

  it('exige slug y name; reporta duplicados', () => {
    const csv = ['slug,name', 'a,', 'b,B', 'b,B2'].join('\n')
    const { categories, errors } = parseCategoriesCsv(csv)
    expect(categories).toHaveLength(1)                 // solo b
    expect(errors.some((e) => /nombre/i.test(e.message))).toBe(true)
    expect(errors.some((e) => /duplicado/i.test(e.message))).toBe(true)
  })

  it('evita que una categoría sea su propia madre', () => {
    const { categories, errors } = parseCategoriesCsv(['slug,name,parent_slug', 'x,X,x'].join('\n'))
    expect(categories[0].parent_slug).toBeNull()
    expect(errors.some((e) => /propia categoría madre/i.test(e.message))).toBe(true)
  })

  it('falla sin columnas obligatorias', () => {
    expect(parseCategoriesCsv('name\nX').errors[0].message).toMatch(/slug/i)
    expect(parseCategoriesCsv('slug\nx').errors[0].message).toMatch(/name|nombre/i)
  })

  it('la plantilla se parsea sin errores', () => {
    const { categories, errors } = parseCategoriesCsv(CATEGORY_IMPORT_TEMPLATE)
    expect(errors).toHaveLength(0)
    expect(categories).toHaveLength(2)
  })
})
