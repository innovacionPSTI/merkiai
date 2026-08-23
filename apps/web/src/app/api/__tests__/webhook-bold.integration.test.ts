/**
 * @jest-environment node
 */
/**
 * Integration tests — POST /api/webhooks/bold
 *
 * Escenarios:
 *   - Bold no configurado (sin bold_api_key) → 503
 *   - Firma inválida → 401 (no toca BD)
 *   - SALE_APPROVED con firma válida → actualiza orden a approved/processing → 200
 *   - Idempotencia: pago ya aprobado + SALE_APPROVED → 200 sin re-procesar
 *   - extractWebhookData null → 200 ok
 *
 * Mocks: @merkiai/database (getPaymentConfig, getStoreConfig, createServerClient, BoldGateway),
 *        @/lib/email, @/lib/shipping/shipments
 */

import { NextRequest } from 'next/server'

// ── Mock del gateway (firma/extracción controladas por test) ──
const mockVerify = jest.fn()
const mockExtract = jest.fn()
const mockMap = jest.fn()

// ── Mock del cliente Supabase (select para idempotencia + update) ──
const mockSingle = jest.fn()
const mockFrom = jest.fn(() => ({
  select: jest.fn(() => ({ eq: jest.fn(() => ({ single: mockSingle })) })),
  update: jest.fn(() => ({ eq: jest.fn(() => ({ select: jest.fn(() => ({ single: mockSingle, maybeSingle: mockSingle })) })) })),
}))

jest.mock('@merkiai/database', () => ({
  createServerClient: jest.fn(() => ({ from: mockFrom })),
  getPaymentConfig: jest.fn(),
  getStoreConfig: jest.fn(),
  applyStockForOrder: jest.fn(),
  markWebhookEventProcessed: jest.fn(async () => ({ duplicate: false })),
  BoldGateway: jest.fn().mockImplementation(() => ({
    verifyWebhook: mockVerify,
    extractWebhookData: mockExtract,
    mapStatus: mockMap,
  })),
}))

jest.mock('@/lib/email', () => ({
  sendOrderConfirmation: jest.fn(),
  sendShippingNotification: jest.fn(),
  buildEmailConfig: jest.fn((apiKey: string, fromEmail: string) => ({ apiKey, fromEmail })),
}))

jest.mock('@/lib/shipping/shipments', () => ({
  createShipmentForOrder: jest.fn().mockResolvedValue(null),
}))

import { getPaymentConfig, getStoreConfig } from '@merkiai/database'
import { POST } from '../webhooks/bold/route'

const mockGetPaymentConfig = getPaymentConfig as jest.MockedFunction<typeof getPaymentConfig>
const mockGetStoreConfig = getStoreConfig as jest.MockedFunction<typeof getStoreConfig>

const configWithBold = { id: 1, active_provider: 'bold', bold_api_key: 'bk', bold_secret_key: 'sk', bold_sandbox: false }

function makeRequest(body: object, signature = 'sig'): NextRequest {
  return new NextRequest('http://localhost/api/webhooks/bold', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-bold-signature': signature },
    body: JSON.stringify(body),
  })
}

const approvedEvent = { type: 'SALE_APPROVED', subject: 'TXN-1', data: { payment_id: 'PAY-1', metadata: { reference: 'ORD-0042' } } }

beforeEach(() => {
  jest.clearAllMocks()
  mockGetPaymentConfig.mockResolvedValue(configWithBold as never)
  mockGetStoreConfig.mockResolvedValue(null as never) // sin email para simplificar
  mockMap.mockReturnValue('approved')
  mockExtract.mockReturnValue({ orderReference: 'ORD-0042', rawStatus: 'SALE_APPROVED', paymentId: 'PAY-1' })
})

describe('POST /api/webhooks/bold', () => {
  it('retorna 503 si Bold no está configurado (sin bold_api_key)', async () => {
    mockGetPaymentConfig.mockResolvedValueOnce({ id: 1, active_provider: 'none' } as never)
    const res = await POST(makeRequest(approvedEvent))
    expect(res.status).toBe(503)
  })

  it('retorna 401 si la firma es inválida', async () => {
    mockVerify.mockReturnValue(false)
    const res = await POST(makeRequest(approvedEvent))
    expect(res.status).toBe(401)
    expect(mockFrom).not.toHaveBeenCalled() // no toca BD
  })

  it('procesa SALE_APPROVED con firma válida y actualiza la orden', async () => {
    mockVerify.mockReturnValue(true)
    mockSingle
      .mockResolvedValueOnce({ data: { payment_status: 'pending' } }) // idempotency read
      .mockResolvedValueOnce({ data: { order_number: 'ORD-0042', customer_email: 'a@b.co' }, error: null }) // update

    const res = await POST(makeRequest(approvedEvent))
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.ok).toBe(true)
  })

  it('es idempotente: pago ya aprobado + SALE_APPROVED responde 200 sin re-procesar', async () => {
    mockVerify.mockReturnValue(true)
    mockSingle.mockResolvedValueOnce({ data: { payment_status: 'approved' } }) // ya aprobado

    const res = await POST(makeRequest(approvedEvent))
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.idempotent).toBe(true)
    // Solo se llamó al read de idempotencia; no al update
    expect(mockSingle).toHaveBeenCalledTimes(1)
  })

  it('responde 200 sin tocar BD si extractWebhookData devuelve null', async () => {
    mockVerify.mockReturnValue(true)
    mockExtract.mockReturnValue(null)

    const res = await POST(makeRequest({ foo: 'bar' }))
    expect(res.status).toBe(200)
    expect(mockFrom).not.toHaveBeenCalled()
  })
})
