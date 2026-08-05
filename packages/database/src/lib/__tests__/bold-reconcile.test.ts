/**
 * Unit tests — núcleo compartido reconcileBoldOrder (@vps/database).
 * Guard bold+pending, not_configured, aprobado (actualiza + descuenta stock), sin datos.
 */

jest.mock('../../client', () => ({ createServerClient: jest.fn() }))
jest.mock('../../queries/payment-config', () => ({ getPaymentConfig: jest.fn() }))
jest.mock('../../providers/payment/BoldGateway', () => ({ BoldGateway: jest.fn() }))
jest.mock('../stock', () => ({ applyStockForOrder: jest.fn() }))

import { reconcileBoldOrder } from '../bold-reconcile'
import { createServerClient } from '../../client'
import { getPaymentConfig } from '../../queries/payment-config'
import { BoldGateway } from '../../providers/payment/BoldGateway'
import { applyStockForOrder } from '../stock'

const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>
const mockGetPaymentConfig = getPaymentConfig as jest.MockedFunction<typeof getPaymentConfig>
const MockBoldGateway = BoldGateway as unknown as jest.Mock
const mockApplyStock = applyStockForOrder as jest.MockedFunction<typeof applyStockForOrder>

const mockSingle = jest.fn()
const mockQuery = jest.fn()

function buildClient() {
  const chain: Record<string, unknown> = {}
  chain.select = () => chain
  chain.eq = () => chain
  chain.update = () => chain
  chain.single = () => mockSingle()
  return { from: () => chain }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockCreateServerClient.mockReturnValue(buildClient() as never)
  mockGetPaymentConfig.mockResolvedValue({ bold_api_key: 'k', bold_secret_key: 's', bold_sandbox: false } as never)
  MockBoldGateway.mockImplementation(() => ({ queryStatusByReference: mockQuery }))
})

describe('reconcileBoldOrder (shared)', () => {
  it('no aplica si el pedido no es Bold', async () => {
    mockSingle.mockResolvedValueOnce({ data: { payment_method: 'wompi', payment_status: 'pending' } })
    expect(await reconcileBoldOrder('VPS-1')).toEqual({ ok: false, reason: 'not_bold' })
    expect(mockQuery).not.toHaveBeenCalled()
  })

  it('not_configured si falta bold_api_key', async () => {
    mockSingle.mockResolvedValueOnce({ data: { payment_method: 'bold', payment_status: 'pending' } })
    mockGetPaymentConfig.mockResolvedValueOnce({} as never)
    expect(await reconcileBoldOrder('VPS-1')).toEqual({ ok: false, reason: 'not_configured' })
  })

  it('aprueba, actualiza y descuenta stock cuando Bold reporta aprobado', async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { payment_method: 'bold', payment_status: 'pending' } }) // read
      .mockResolvedValueOnce({ data: { order_number: 'VPS-1' }, error: null })                 // update
    mockQuery.mockResolvedValueOnce({ status: 'approved', rawStatus: 'SALE_APPROVED', paymentId: 'P1' })

    const r = await reconcileBoldOrder('VPS-1')
    expect(r).toEqual({ ok: true, status: 'approved' })
    expect(mockApplyStock).toHaveBeenCalledWith('VPS-1')
  })

  it('pending si Bold aún no tiene notificación', async () => {
    mockSingle.mockResolvedValueOnce({ data: { payment_method: 'bold', payment_status: 'pending' } })
    mockQuery.mockResolvedValueOnce(null)
    expect(await reconcileBoldOrder('VPS-1')).toEqual({ ok: true, status: 'pending', reason: 'no_data' })
    expect(mockApplyStock).not.toHaveBeenCalled()
  })

  it('idempotente: pedido ya aprobado no reconsulta', async () => {
    mockSingle.mockResolvedValueOnce({ data: { payment_method: 'bold', payment_status: 'approved' } })
    expect(await reconcileBoldOrder('VPS-1')).toEqual({ ok: true, status: 'approved' })
    expect(mockQuery).not.toHaveBeenCalled()
  })
})
