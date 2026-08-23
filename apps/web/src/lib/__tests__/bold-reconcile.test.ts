/**
 * @jest-environment node
 */
/**
 * Unit tests — reconcileBoldOrder (HU-095)
 *
 * Verifica el guard (bold + pending), la idempotencia, y que el estado provenga
 * de la API de Bold (mockeada), nunca del cliente.
 */

const mockSingle = jest.fn()
const mockFrom = jest.fn(() => ({
  select: jest.fn(() => ({ eq: jest.fn(() => ({ single: mockSingle })) })),
  update: jest.fn(() => ({ eq: jest.fn(() => ({ select: jest.fn(() => ({ single: mockSingle })) })) })),
}))
const mockQuery = jest.fn()

jest.mock('@merkiai/database', () => ({
  createServerClient: jest.fn(() => ({ from: mockFrom })),
  getPaymentConfig: jest.fn(),
  getStoreConfig: jest.fn(),
  applyStockForOrder: jest.fn(),
  BoldGateway: jest.fn().mockImplementation(() => ({ queryStatusByReference: mockQuery })),
}))

jest.mock('@/lib/email', () => ({
  sendOrderConfirmation: jest.fn(),
  sendShippingNotification: jest.fn(),
  buildEmailConfig: jest.fn(() => ({ apiKey: 'x', fromEmail: 'y' })),
}))

jest.mock('@/lib/shipping/shipments', () => ({
  createShipmentForOrder: jest.fn().mockResolvedValue(null),
}))

import { getPaymentConfig, getStoreConfig } from '@merkiai/database'
import { reconcileBoldOrder } from '../bold-reconcile'

const mockGetPaymentConfig = getPaymentConfig as jest.MockedFunction<typeof getPaymentConfig>
const mockGetStoreConfig = getStoreConfig as jest.MockedFunction<typeof getStoreConfig>

beforeEach(() => {
  jest.clearAllMocks()
  mockGetPaymentConfig.mockResolvedValue({ bold_api_key: 'k', bold_secret_key: 's', bold_sandbox: false } as never)
  mockGetStoreConfig.mockResolvedValue(null as never)
})

describe('reconcileBoldOrder', () => {
  it('no aplica si el pedido no es Bold', async () => {
    mockSingle.mockResolvedValueOnce({ data: { payment_method: 'wompi', payment_status: 'pending' } })
    const r = await reconcileBoldOrder('ORD-0001')
    expect(r).toEqual({ ok: false, reason: 'not_bold' })
    expect(mockQuery).not.toHaveBeenCalled()
  })

  it('es idempotente si el pedido ya está aprobado (no consulta a Bold)', async () => {
    mockSingle.mockResolvedValueOnce({ data: { payment_method: 'bold', payment_status: 'approved' } })
    const r = await reconcileBoldOrder('ORD-0002')
    expect(r).toEqual({ ok: true, status: 'approved' })
    expect(mockQuery).not.toHaveBeenCalled()
  })

  it('actualiza a approved cuando Bold reporta el pago aprobado', async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { payment_method: 'bold', payment_status: 'pending' } }) // read
      .mockResolvedValueOnce({ data: { order_number: 'ORD-0003' }, error: null })             // update
    mockQuery.mockResolvedValueOnce({ status: 'approved', rawStatus: 'SALE_APPROVED', paymentId: 'P1' })

    const r = await reconcileBoldOrder('ORD-0003')
    expect(r).toEqual({ ok: true, status: 'approved' })
    expect(mockQuery).toHaveBeenCalledWith('ORD-0003')
  })

  it('devuelve pending si Bold aún no tiene notificación', async () => {
    mockSingle.mockResolvedValueOnce({ data: { payment_method: 'bold', payment_status: 'pending' } })
    mockQuery.mockResolvedValueOnce(null)

    const r = await reconcileBoldOrder('ORD-0004')
    expect(r).toEqual({ ok: true, status: 'pending', reason: 'no_data' })
    // Solo el read; no hubo update
    expect(mockSingle).toHaveBeenCalledTimes(1)
  })

  it('responde not_configured si falta bold_api_key', async () => {
    mockSingle.mockResolvedValueOnce({ data: { payment_method: 'bold', payment_status: 'pending' } })
    mockGetPaymentConfig.mockResolvedValueOnce({} as never)

    const r = await reconcileBoldOrder('ORD-0005')
    expect(r).toEqual({ ok: false, reason: 'not_configured' })
    expect(mockQuery).not.toHaveBeenCalled()
  })
})
