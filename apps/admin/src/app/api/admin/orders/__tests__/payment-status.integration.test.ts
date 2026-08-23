/**
 * @jest-environment node
 *
 * Integration tests — PATCH /api/admin/orders/[id]/payment-status (HU-096)
 *
 * Cubre: guards de auth, validación del valor, aprobar (approved + processing),
 * rechazar (rejected).
 */

import { NextRequest } from 'next/server'

jest.mock('@merkiai/database', () => ({ createServerClient: jest.fn(), applyStockForOrder: jest.fn().mockResolvedValue(undefined), restoreStockForOrder: jest.fn().mockResolvedValue(undefined) }))
jest.mock('@/lib/auth', () => ({ getAdminUser: jest.fn() }))
jest.mock('@/lib/email', () => ({ sendPaymentConfirmed: jest.fn() }))

import { createServerClient } from '@merkiai/database'
import { getAdminUser } from '@/lib/auth'
import { PATCH } from '../[id]/payment-status/route'

const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>
const mockGetAdminUser = getAdminUser as jest.MockedFunction<typeof getAdminUser>

function makeRequest(body: object): NextRequest {
  return new NextRequest('http://localhost/api/admin/orders/42/payment-status', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

/** Mock de Supabase: orders.update().eq().select().single() + store_config.select().single() */
function buildSupabaseMock(orderData: object | null) {
  const updateMock = jest.fn(() => ({ eq: jest.fn(() => ({ select: jest.fn(() => ({ single: jest.fn().mockResolvedValue({ data: orderData, error: orderData ? null : new Error('x') }) })) })) }))
  const from = jest.fn((table: string) => {
    if (table === 'store_config') {
      return { select: jest.fn(() => ({ single: jest.fn().mockResolvedValue({ data: null }) })) }
    }
    return { update: updateMock }
  })
  return { mockSupabase: { from }, updateMock }
}

const vendedor = { id: 'u1', role: 'vendedor', email: 'v@test.com' }
const gestor   = { id: 'u2', role: 'gestor_tienda', email: 'g@test.com' }
const params = { params: Promise.resolve({ id: '42' }) }

beforeEach(() => jest.clearAllMocks())

describe('PATCH /payment-status — auth', () => {
  it('401 si no hay sesión', async () => {
    mockGetAdminUser.mockResolvedValue(null)
    const res = await PATCH(makeRequest({ payment_status: 'approved' }), params)
    expect(res.status).toBe(401)
  })

  it('403 si el rol no tiene permiso (gestor_tienda)', async () => {
    mockGetAdminUser.mockResolvedValue(gestor as never)
    const res = await PATCH(makeRequest({ payment_status: 'approved' }), params)
    expect(res.status).toBe(403)
  })
})

describe('PATCH /payment-status — validación', () => {
  beforeEach(() => mockGetAdminUser.mockResolvedValue(vendedor as never))

  it('400 si payment_status no es approved/rejected', async () => {
    const res = await PATCH(makeRequest({ payment_status: 'foo' }), params)
    expect(res.status).toBe(400)
  })
})

describe('PATCH /payment-status — happy path', () => {
  beforeEach(() => mockGetAdminUser.mockResolvedValue(vendedor as never))

  it('aprobar → payment_status approved + status processing', async () => {
    const { mockSupabase, updateMock } = buildSupabaseMock({
      payment_status: 'approved', status: 'processing',
      order_number: 'ORD-0001', customer_email: 'a@b.co', customer_name: 'Ana',
    })
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    const res = await PATCH(makeRequest({ payment_status: 'approved' }), params)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.payment_status).toBe('approved')
    expect(data.status).toBe('processing')
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ payment_status: 'approved', status: 'processing' }),
    )
  })

  it('rechazar → payment_status rejected sin avanzar el estado', async () => {
    const { mockSupabase, updateMock } = buildSupabaseMock({
      payment_status: 'rejected', status: 'pending',
      order_number: 'ORD-0002', customer_email: 'a@b.co', customer_name: 'Ana',
    })
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    const res = await PATCH(makeRequest({ payment_status: 'rejected' }), params)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.payment_status).toBe('rejected')
    expect(updateMock).toHaveBeenCalledWith(
      expect.not.objectContaining({ status: 'processing' }),
    )
  })
})
