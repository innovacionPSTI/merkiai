/**
 * @jest-environment node
 *
 * Integration tests — PATCH /api/admin/products/[id]
 *
 * Prueba crítica: el handler NO debe hacer spread del body a `update()`. El form
 * del admin incluye campos solo-UI (selectedTypeIds, category, created_at, …) que
 * no son columnas de `products` y rompían el update con
 * "Could not find the 'selectedTypeIds' column of 'products'". El PATCH debe
 * filtrar a una whitelist de columnas conocidas.
 */

import { NextRequest } from 'next/server'

const mockProductSingle = jest.fn(() => Promise.resolve({ data: { id: 13, name: 'Cafe' }, error: null }))
const mockProductSelect = jest.fn(() => ({ single: mockProductSingle }))
const mockProductEq = jest.fn(() => ({ select: mockProductSelect }))
const mockProductUpdate = jest.fn(() => ({ eq: mockProductEq }))

const mockVariantUpsert = jest.fn(() => Promise.resolve({ error: null }))

// HU-113: el PATCH lee el slug previo antes del update (select→eq→single).
const mockPrevSlugSingle = jest.fn(() => Promise.resolve({ data: { slug: 'slug-viejo' }, error: null }))
const mockProductPreSelect = jest.fn(() => ({ eq: () => ({ single: mockPrevSlugSingle }) }))

const mockFrom = jest.fn((table: string) => {
  if (table === 'products') return { update: mockProductUpdate, select: mockProductPreSelect }
  if (table === 'product_variants') return { upsert: mockVariantUpsert, delete: () => ({ eq: () => Promise.resolve({ error: null }) }) }
  return {}
})

jest.mock('@merkiai/database', () => ({
  createServerClient: jest.fn(() => ({ from: mockFrom })),
  suggestRedirectOnSlugChange: jest.fn().mockResolvedValue(undefined),
}))
jest.mock('@/lib/auth', () => ({
  getAdminUser: jest.fn(async () => ({ email: 'a@x.com', displayName: 'A', role: 'admin', tenantId: 't1', needsWorkspaceSelection: false })),
}))
jest.mock('@/lib/admin-db', () => ({ getAdminDb: () => ({ from: mockFrom }) }))

import { PATCH } from '../[id]/route'

function makeReq(body: object): NextRequest {
  return new NextRequest('http://localhost/api/admin/products/13', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => jest.clearAllMocks())

describe('PATCH /api/admin/products/[id]', () => {
  it('ignora campos solo-UI y solo actualiza columnas conocidas', async () => {
    const res = await PATCH(
      makeReq({
        name: 'Cafe producto',
        slug: 'cafe-producto',
        variant_options: ['Tueste', 'Peso'],
        // Ruido solo-UI que antes rompía el update:
        selectedTypeIds: [1, 2],
        category: { id: 1, name: 'Café Medio' },
        created_at: '2026-01-01',
        min_price: 1,
        max_price: 9,
        tenant_id: 'hacker',
      }),
      { params: Promise.resolve({ id: '13' }) },
    )

    expect(res.status).toBe(200)
    expect(mockProductUpdate).toHaveBeenCalledTimes(1)
    const payload = mockProductUpdate.mock.calls[0][0] as Record<string, unknown>
    expect(payload).toEqual({ name: 'Cafe producto', slug: 'cafe-producto', variant_options: ['Tueste', 'Peso'] })
    // Nada de ruido ni tenant_id del cliente llega al update.
    expect(payload).not.toHaveProperty('selectedTypeIds')
    expect(payload).not.toHaveProperty('category')
    expect(payload).not.toHaveProperty('created_at')
    expect(payload).not.toHaveProperty('tenant_id')
  })

  it('no toca columnas ausentes del body (update parcial)', async () => {
    await PATCH(makeReq({ active: false }), { params: Promise.resolve({ id: '13' }) })
    const payload = mockProductUpdate.mock.calls[0][0] as Record<string, unknown>
    expect(payload).toEqual({ active: false })
  })
})
