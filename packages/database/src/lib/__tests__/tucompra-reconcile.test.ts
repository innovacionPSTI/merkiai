/**
 * Unit tests — núcleo compartido reconcileTuCompraOrder (@vps/database).
 * Tu Compra no tiene webhook: la confirmación se hace por reconsulta de estado.
 * Guard tucompra+pending, not_configured, aprobado (actualiza + descuenta stock), sin datos.
 */

jest.mock('../../client', () => ({ createServerClient: jest.fn() }))
jest.mock('../../queries/payment-config', () => ({ getPaymentConfig: jest.fn() }))
jest.mock('../../providers/payment/TuCompraGateway', () => ({ TuCompraGateway: jest.fn() }))
jest.mock('../stock', () => ({ applyStockForOrder: jest.fn() }))

import { reconcileTuCompraOrder } from '../tucompra-reconcile'
import { createServerClient } from '../../client'
import { getPaymentConfig } from '../../queries/payment-config'
import { TuCompraGateway } from '../../providers/payment/TuCompraGateway'
import { applyStockForOrder } from '../stock'

const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>
const mockGetPaymentConfig = getPaymentConfig as jest.MockedFunction<typeof getPaymentConfig>
const MockGateway = TuCompraGateway as unknown as jest.Mock
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
  mockGetPaymentConfig.mockResolvedValue({ tucompra_user: 'u', tucompra_password: 'p', tucompra_terminal: 't' } as never)
  MockGateway.mockImplementation(() => ({ queryStatusByReference: mockQuery }))
})

describe('reconcileTuCompraOrder (shared)', () => {
  it('no aplica si el pedido no es Tu Compra', async () => {
    mockSingle.mockResolvedValueOnce({ data: { payment_method: 'bold', payment_status: 'pending' } })
    expect(await reconcileTuCompraOrder('ORD-1')).toEqual({ ok: false, reason: 'not_tucompra' })
    expect(mockQuery).not.toHaveBeenCalled()
  })

  it('not_configured si faltan credenciales', async () => {
    mockSingle.mockResolvedValueOnce({ data: { payment_method: 'tucompra', payment_status: 'pending' } })
    mockGetPaymentConfig.mockResolvedValueOnce({} as never)
    expect(await reconcileTuCompraOrder('ORD-1')).toEqual({ ok: false, reason: 'not_configured' })
  })

  it('aprueba, actualiza y descuenta stock cuando Tu Compra reporta aprobado', async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { payment_method: 'tucompra', payment_status: 'pending' } }) // read
      .mockResolvedValueOnce({ data: { order_number: 'ORD-1' }, error: null })                     // update
    mockQuery.mockResolvedValueOnce({ status: 'approved', rawStatus: 'APROBADA', paymentId: 'TX-1' })

    const r = await reconcileTuCompraOrder('ORD-1')
    expect(r).toEqual({ ok: true, status: 'approved' })
    expect(mockApplyStock).toHaveBeenCalledWith('ORD-1')
  })

  it('pending si Tu Compra aún no tiene información', async () => {
    mockSingle.mockResolvedValueOnce({ data: { payment_method: 'tucompra', payment_status: 'pending' } })
    mockQuery.mockResolvedValueOnce(null)
    expect(await reconcileTuCompraOrder('ORD-1')).toEqual({ ok: true, status: 'pending', reason: 'no_data' })
    expect(mockApplyStock).not.toHaveBeenCalled()
  })

  it('idempotente: pedido ya aprobado no reconsulta', async () => {
    mockSingle.mockResolvedValueOnce({ data: { payment_method: 'tucompra', payment_status: 'approved' } })
    expect(await reconcileTuCompraOrder('ORD-1')).toEqual({ ok: true, status: 'approved' })
    expect(mockQuery).not.toHaveBeenCalled()
  })
})
