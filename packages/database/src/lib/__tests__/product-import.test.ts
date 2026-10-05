import {
  parseProductsCsv,
  parseCsv,
  PRODUCT_IMPORT_TEMPLATE,
} from '../product-import'

describe('parseCsv', () => {
  it('maneja comillas, comas y saltos de línea dentro de comillas', () => {
    const rows = parseCsv('a,b\n"hola, mundo","línea1\nlínea2"')
    expect(rows).toEqual([
      ['a', 'b'],
      ['hola, mundo', 'línea1\nlínea2'],
    ])
  })

  it('maneja comillas escapadas y CRLF', () => {
    const rows = parseCsv('x\r\n"dice ""hola"""')
    expect(rows).toEqual([['x'], ['dice "hola"']])
  })

  it('descarta el BOM inicial', () => {
    const rows = parseCsv('﻿a,b')
    expect(rows[0]).toEqual(['a', 'b'])
  })
})

describe('parseProductsCsv', () => {
  const header =
    'slug,name,description,category,featured,active,images,options,price,compare_at_price,stock,sku,variant_image,variant_active,weight_kg'

  it('agrupa varias filas con el mismo slug en un producto con varias variantes', () => {
    const csv = [
      header,
      'cam,Camiseta,Algodón,Ropa,true,true,http://a.jpg|http://b.jpg,Color=Negro;Talla=M,59900,79900,10,CAM-M,,true,0.3',
      'cam,,,,,,,Color=Negro;Talla=L,59900,,8,CAM-L,,true,0.3',
    ].join('\n')

    const { products, errors } = parseProductsCsv(csv)
    expect(errors).toHaveLength(0)
    expect(products).toHaveLength(1)

    const p = products[0]
    expect(p.slug).toBe('cam')
    expect(p.name).toBe('Camiseta')
    expect(p.category).toBe('Ropa')
    expect(p.featured).toBe(true)
    expect(p.images).toEqual(['http://a.jpg', 'http://b.jpg'])
    expect(p.variant_options).toEqual(['Color', 'Talla'])
    expect(p.variants).toHaveLength(2)
    expect(p.variants[0]).toMatchObject({
      price: 59900, compare_at_price: 79900, stock: 10, sku: 'CAM-M',
      attributes: { Color: 'Negro', Talla: 'M' }, weight_kg: 0.3, active: true,
    })
    expect(p.variants[1]).toMatchObject({ price: 59900, compare_at_price: null, stock: 8, sku: 'CAM-L' })
  })

  it('reporta error y omite filas sin precio válido, sin abortar el resto', () => {
    const csv = [
      'slug,name,price,stock,sku',
      'a,Prod A,0,,',            // precio 0 → inválido
      'b,Prod B,1990,5,SKU-B',   // válido
    ].join('\n')

    const { products, errors } = parseProductsCsv(csv)
    expect(errors).toHaveLength(1)
    expect(errors[0].row).toBe(2)
    expect(products).toHaveLength(1)
    expect(products[0].slug).toBe('b')
  })

  it('exige nombre en la primera fila de cada slug', () => {
    const csv = ['slug,name,price', 'x,,1000'].join('\n')
    const { products, errors } = parseProductsCsv(csv)
    expect(products).toHaveLength(0)
    expect(errors[0].message).toMatch(/nombre/i)
  })

  it('acepta cabeceras en español (sinónimos)', () => {
    const csv = ['slug,nombre,precio,inventario', 'z,Zapato,120000,3'].join('\n')
    const { products, errors } = parseProductsCsv(csv)
    expect(errors).toHaveLength(0)
    expect(products[0]).toMatchObject({ slug: 'z', name: 'Zapato' })
    expect(products[0].variants[0]).toMatchObject({ price: 120000, stock: 3 })
  })

  it('parsea números con separador de miles', () => {
    const csv = ['slug,name,price', 'q,Q,"1.299.900"'].join('\n')
    const { products } = parseProductsCsv(csv)
    expect(products[0].variants[0].price).toBe(1299900)
  })

  it('falla si faltan columnas obligatorias', () => {
    expect(parseProductsCsv('name,price\nX,100').errors[0].message).toMatch(/slug/i)
    expect(parseProductsCsv('slug,name\nx,X').errors[0].message).toMatch(/price|precio/i)
  })

  it('la plantilla incluida se parsea sin errores', () => {
    const { products, errors } = parseProductsCsv(PRODUCT_IMPORT_TEMPLATE)
    expect(errors).toHaveLength(0)
    expect(products).toHaveLength(1)
    expect(products[0].variants).toHaveLength(2)
  })
})
