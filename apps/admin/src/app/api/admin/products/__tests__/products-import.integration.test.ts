/**
 * @jest-environment node
 *
 * Integration — POST /api/admin/products/import (HU-124)
 *   · agrupa filas por slug y crea producto + variantes
 *   · omite slugs ya existentes
 *   · modo preview no escribe
 *   · respeta el tope de plan (resolveLimit)
 */
import { NextRequest } from 'next/server'

// ── Mocks ──────────────────────────────────────────────────────────────────
let existingSlugs: { slug: string }[] = []
let planLimit: number | null = null
const insertedProducts: any[] = []
const insertedVariants: any[] = []

const productsTable = () => ({
  select: jest.fn(() => Promise.resolve({ data: existingSlugs })),
  insert: jest.fn((row: any) => ({
    select: () => ({
      single: () => {
        const prod = { id: insertedProducts.length + 1, ...row }
        insertedProducts.push(prod)
        return Promise.resolve({ data: prod, error: null })
      },
    }),
  })),
  delete: jest.fn(() => ({ eq: () => Promise.resolve({ error: null }) })),
})
const variantsTable = () => ({
  insert: jest.fn((rows: any[]) => { insertedVariants.push(...rows); return Promise.resolve({ error: null }) }),
})
const categoriesTable = () => ({
  select: jest.fn(() => Promise.resolve({ data: [{ id: 7, name: 'Ropa' }] })),
})

const mockFrom = jest.fn((table: string) => {
  if (table === 'products') return productsTable()
  if (table === 'product_variants') return variantsTable()
  if (table === 'categories') return categoriesTable()
  return {}
})

jest.mock('@/lib/auth', () => ({
  getAdminUser: jest.fn(async () => ({ email: 'a@x.com', role: 'admin', tenantId: 't1' })),
}))
jest.mock('@/lib/admin-db', () => ({ getAdminDb: () => ({ from: mockFrom }) }))
jest.mock('@/lib/entitlements', () => ({
  getTenantEntitlements: jest.fn(async () => ({ tenantId: 't1', entitlements: planLimit === null ? null : {} })),
  resolveLimit: () => planLimit,
  LIMITS: { PRODUCTS: 'products' },
}))

import { POST } from '../import/route'

function post(body: any) {
  return POST(new NextRequest('http://localhost/api/admin/products/import', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }) as any)
}

const CSV = [
  'slug,name,category,price,stock,sku,options',
  'cam,Camiseta,Ropa,59900,10,CAM-M,Color=Negro;Talla=M',
  'cam,,,,8,CAM-L,Color=Negro;Talla=L',   // 2ª variante del mismo producto (fila sin precio → se omite)
  'gorra,Gorra,Ropa,25000,5,GOR,',
].join('\n')

beforeEach(() => {
  existingSlugs = []; planLimit = null
  insertedProducts.length = 0; insertedVariants.length = 0
  jest.clearAllMocks()
})

describe('POST /api/admin/products/import', () => {
  it('crea productos y variantes agrupando por slug', async () => {
    // CSV válido: cam con 1 variante válida (la 2ª sin precio da error) + gorra
    const csv = [
      'slug,name,category,price,stock,sku,options',
      'cam,Camiseta,Ropa,59900,10,CAM-M,Color=Negro;Talla=M',
      'cam,,,59900,8,CAM-L,Color=Negro;Talla=L',
      'gorra,Gorra,Ropa,25000,5,GOR,',
    ].join('\n')
    const res = await post({ csv })
    const data = await res.json()
    expect(res.status).toBe(201)
    expect(data.created).toBe(2)
    expect(insertedProducts).toHaveLength(2)
    // La categoría "Ropa" se resolvió a id 7
    expect(insertedProducts[0].category_id).toBe(7)
    // cam tiene 2 variantes
    expect(insertedVariants.filter((v) => v.sku?.startsWith('CAM'))).toHaveLength(2)
  })

  it('omite slugs ya existentes', async () => {
    existingSlugs = [{ slug: 'cam' }]
    const res = await post({ csv: CSV })
    const data = await res.json()
    expect(data.created).toBe(1) // solo gorra
    expect(data.skipped.some((s: any) => s.slug === 'cam')).toBe(true)
  })

  it('preview no escribe nada', async () => {
    const res = await post({ csv: CSV, preview: true })
    const data = await res.json()
    expect(data.preview).toBe(true)
    expect(insertedProducts).toHaveLength(0)
    expect(insertedVariants).toHaveLength(0)
  })

  it('respeta el tope de plan', async () => {
    planLimit = 1 // solo cabe 1 producto nuevo
    const res = await post({ csv: CSV })
    const data = await res.json()
    expect(data.created).toBe(1)
    expect(data.skipped.some((s: any) => /plan/i.test(s.reason))).toBe(true)
  })

  it('rechaza CSV vacío', async () => {
    const res = await post({ csv: '   ' })
    expect(res.status).toBe(400)
  })
})
