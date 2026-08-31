/**
 * @jest-environment node
 *
 * HU-173 — límite de productos por plan en la creación (admin).
 */
const mockFrom = jest.fn()
jest.mock('@merkiai/database', () => ({ createServerClient: () => ({ from: mockFrom }) }))
// HU-158 Etapa 2: la ruta usa getAdminUser (tenant) + getAdminDb (cliente RLS).
jest.mock('@/lib/auth', () => ({
  getAdminUser: jest.fn(async () => ({ email: 'a@x.com', displayName: 'A', role: 'admin', tenantId: 't1', needsWorkspaceSelection: false })),
}))
jest.mock('@/lib/admin-db', () => ({ getAdminDb: () => ({ from: mockFrom }) }))
jest.mock('@/lib/entitlements', () => ({
  ...jest.requireActual('@/lib/entitlements'), // conserva withinLimit real
  getTenantEntitlements: jest.fn(async () => ({
    tenantId: 't1',
    entitlements: { features: {}, limits: { products: 1 } },
  })),
}))

import { NextRequest } from 'next/server'
import { POST } from '../route'

function req(body: object) {
  return new NextRequest('http://localhost/api/admin/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => jest.clearAllMocks())

it('devuelve 403 al alcanzar el límite de productos del plan', async () => {
  // El count de productos (= al límite) hace fallar withinLimit → 403.
  mockFrom.mockImplementation(() => ({
    select: jest.fn(() => ({ eq: jest.fn(async () => ({ count: 1 })) })),
  }))

  const res = await POST(req({ name: 'Nuevo', slug: 'nuevo', variants: [{ price: 1000 }] }))
  expect(res.status).toBe(403)
  const body = await res.json()
  expect(body.error).toMatch(/[Ll]ímite de productos/)
})
