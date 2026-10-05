import {
  parseProductsCsv,
  parseCsv,
  productsToCsv,
  objectsToCsv,
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

describe('productsToCsv (HU-130)', () => {
  it('serializa producto con varias variantes; campos de producto solo en la 1ª fila', () => {
    const csv = productsToCsv([{
      slug: 'cam', name: 'Camiseta', description: 'Algodón', category: 'Ropa',
      featured: true, active: true, images: [{ url: 'http://a.jpg' }, 'http://b.jpg'],
      variant_options: ['Color', 'Talla'],
      variants: [
        { price: 59900, compare_at_price: 79900, stock: 10, sku: 'CAM-M', active: true, attributes: { Color: 'Negro', Talla: 'M' }, weight_kg: 0.3 },
        { price: 59900, stock: 8, sku: 'CAM-L', active: true, attributes: { Color: 'Negro', Talla: 'L' } },
      ],
    }])
    const rows = parseCsv(csv)
    expect(rows[0][0]).toBe('slug')           // header
    expect(rows).toHaveLength(3)              // header + 2 variantes
    expect(rows[1][1]).toBe('Camiseta')       // name en 1ª fila
    expect(rows[2][1]).toBe('')               // name vacío en 2ª
    // options reconstruidas en orden de variant_options
    const optIdx = rows[0].indexOf('options')
    expect(rows[1][optIdx]).toBe('Color=Negro;Talla=M')
  })

  it('escapa celdas con comas/comillas', () => {
    const csv = productsToCsv([{
      slug: 's', name: 'Café "especial", lote 1',
      variants: [{ price: 1000 }],
    }])
    const rows = parseCsv(csv)
    expect(rows[1][1]).toBe('Café "especial", lote 1')
  })

  it('objectsToCsv respeta el orden de columnas, escapa y serializa objetos (HU-125)', () => {
    const csv = objectsToCsv(
      ['id', 'name', 'addr'],
      [{ id: 1, name: 'Ana, Pérez', addr: { city: 'Cali' }, extra: 'ignorado' }],
    )
    const rows = parseCsv(csv)
    expect(rows[0]).toEqual(['id', 'name', 'addr'])
    expect(rows[1][1]).toBe('Ana, Pérez')              // celda con coma escapada
    expect(JSON.parse(rows[1][2])).toEqual({ city: 'Cali' }) // objeto → JSON
  })

  it('ida y vuelta: export → import conserva los datos', () => {
    const original = [{
      slug: 'cam', name: 'Camiseta', description: 'Algodón', category: 'Ropa',
      featured: true, active: true, images: ['http://a.jpg'],
      variant_options: ['Color'],
      variants: [
        { price: 59900, compare_at_price: 79900, stock: 10, sku: 'CAM-N', active: true, attributes: { Color: 'Negro' }, weight_kg: 0.3, length_cm: 30, width_cm: 25, height_cm: 3 },
        { price: 61900, stock: 4, sku: 'CAM-B', active: true, attributes: { Color: 'Blanco' } },
      ],
    }]
    const { products, errors } = parseProductsCsv(productsToCsv(original))
    expect(errors).toHaveLength(0)
    expect(products).toHaveLength(1)
    const p = products[0]
    expect(p).toMatchObject({ slug: 'cam', name: 'Camiseta', category: 'Ropa', featured: true, images: ['http://a.jpg'], variant_options: ['Color'] })
    expect(p.variants).toHaveLength(2)
    expect(p.variants[0]).toMatchObject({ price: 59900, compare_at_price: 79900, stock: 10, sku: 'CAM-N', attributes: { Color: 'Negro' }, weight_kg: 0.3 })
    expect(p.variants[1]).toMatchObject({ price: 61900, stock: 4, sku: 'CAM-B', attributes: { Color: 'Blanco' } })
  })
})
