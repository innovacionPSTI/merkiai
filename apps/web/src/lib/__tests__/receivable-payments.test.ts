/**
 * @jest-environment node
 */
const mockRegister = jest.fn()
const mockMaybe = jest.fn()
jest.mock('@merkiai/database', () => ({
  registerPayment: (...a: unknown[]) => mockRegister(...a),
}))
jest.mock('../machine-db', () => ({
  getMachineDb: () => ({ from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: mockMaybe }) }) }) }) }),
}))
import { handleReceivableWebhook, isReceivableReference } from '../receivable-payments'

beforeEach(() => { mockRegister.mockReset(); mockMaybe.mockReset() })

describe('abonos de cartera por webhook', () => {
  it('reconoce referencias de cartera', () => {
    expect(isReceivableReference('CXC-5-123')).toBe(true)
    expect(isReceivableReference('ORD-5')).toBe(false)
  })
  it('pago aprobado → registra el abono idempotente por transacción', async () => {
    mockMaybe.mockResolvedValue({ data: { id: 5, party_id: 'p1' } })
    mockRegister.mockResolvedValue({ deduped: false, surplus: 0, applied: [] })
    const res = await handleReceivableWebhook({ tenantId: 't1', provider: 'wompi', reference: 'CXC-5-1', approved: true, paymentId: 'tx9', amountCop: 50000 })
    expect(await res.json()).toEqual({ ok: true, receivable: 'applied' })
    expect(mockRegister.mock.calls[0][2]).toMatchObject({ party_id: 'p1', document_id: 5, amount: 50000, method: 'link', op_key: 'link:wompi:tx9' })
  })
  it('no aprobado o sin monto → no registra', async () => {
    expect(await (await handleReceivableWebhook({ tenantId: 't1', provider: 'bold', reference: 'CXC-5-1', approved: false, amountCop: 1 })).json()).toMatchObject({ receivable: 'not_approved' })
    expect(await (await handleReceivableWebhook({ tenantId: 't1', provider: 'bold', reference: 'CXC-5-1', approved: true, amountCop: null })).json()).toMatchObject({ receivable: 'no_amount' })
    expect(mockRegister).not.toHaveBeenCalled()
  })
  it('error al registrar → 500 para que la pasarela reintente', async () => {
    mockMaybe.mockResolvedValue({ data: { id: 5, party_id: 'p1' } })
    mockRegister.mockRejectedValue(new Error('db'))
    const res = await handleReceivableWebhook({ tenantId: 't1', provider: 'payzen', reference: 'CXC-5-1', approved: true, paymentId: 'x', amountCop: 10 })
    expect(res.status).toBe(500)
  })
})
